#!/usr/bin/env pwsh
# RTS installer for Windows
# Usage: powershell -c "irm https://urubucode.github.io/website/install.ps1 | iex"

param(
  [String]$Version = "latest",
  [Switch]$NoPathUpdate = $false,
  [Switch]$NoRegisterInstallation = $false,
  [Switch]$DownloadWithoutCurl = $false
);

$Arch = (Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Environment').PROCESSOR_ARCHITECTURE
if (-not ($Arch -eq "AMD64" -or $Arch -eq "ARM64")) {
  Write-Output "Install Failed:"
  Write-Output "RTS for Windows is only available for x86 64-bit and ARM64 Windows.`n"
  return 1
}

$ErrorActionPreference = "Stop"

function Publish-Env {
  if (-not ("Win32.NativeMethods" -as [Type])) {
    Add-Type -Namespace Win32 -Name NativeMethods -MemberDefinition @"
[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
public static extern IntPtr SendMessageTimeout(
    IntPtr hWnd, uint Msg, UIntPtr wParam, string lParam,
    uint fuFlags, uint uTimeout, out UIntPtr lpdwResult);
"@
  }
  $HWND_BROADCAST = [IntPtr] 0xffff
  $WM_SETTINGCHANGE = 0x1a
  $result = [UIntPtr]::Zero
  [Win32.NativeMethods]::SendMessageTimeout($HWND_BROADCAST, $WM_SETTINGCHANGE,
    [UIntPtr]::Zero, "Environment", 2, 5000, [ref] $result) | Out-Null
}

function Write-Env {
  param([String]$Key, [String]$Value)
  $RegisterKey = Get-Item -Path 'HKCU:'
  $EnvRegisterKey = $RegisterKey.OpenSubKey('Environment', $true)
  if ($null -eq $Value) {
    $EnvRegisterKey.DeleteValue($Key)
  } else {
    $RegistryValueKind = if ($Value.Contains('%')) {
      [Microsoft.Win32.RegistryValueKind]::ExpandString
    } elseif ($EnvRegisterKey.GetValue($Key)) {
      $EnvRegisterKey.GetValueKind($Key)
    } else {
      [Microsoft.Win32.RegistryValueKind]::String
    }
    $EnvRegisterKey.SetValue($Key, $Value, $RegistryValueKind)
  }
  Publish-Env
}

function Get-Env {
  param([String] $Key)
  $RegisterKey = Get-Item -Path 'HKCU:'
  $EnvRegisterKey = $RegisterKey.OpenSubKey('Environment')
  $EnvRegisterKey.GetValue($Key, $null, [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
}

function Install-Rts {
  param([string]$Version)

  $IsARM64 = $Arch -eq "ARM64"
  $Artifact = if ($IsARM64) { "rts-Windows-ARM64" } else { "rts-Windows-X64" }

  $RtsRoot = if ($env:RTS_INSTALL) { $env:RTS_INSTALL } else { "${Home}\.rts" }
  $RtsBin = mkdir -Force "${RtsRoot}\bin"

  try { Remove-Item "${RtsBin}\rts.exe" -Force }
  catch [System.Management.Automation.ItemNotFoundException] { }
  catch [System.UnauthorizedAccessException] {
    $openProcesses = Get-Process -Name rts -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq "${RtsBin}\rts.exe" }
    if ($openProcesses.Count -gt 0) {
      Write-Output "Install Failed - An older RTS is running. Close it and try again."
      return 1
    }
    Write-Output "Install Failed - Could not remove existing rts.exe"
    return 1
  } catch {
    Write-Output "Install Failed - Unknown error removing existing installation"
    Write-Output $_
    return 1
  }

  $SiteBase = if ($env:RTS_SITE) { $env:RTS_SITE } else { "https://urubucode.github.io/website" }
  $PagesBase = if ($env:RTS_PAGES) { $env:RTS_PAGES } else { "https://urubucode.github.io/rts" }

  Write-Output "Fetching latest RTS build metadata..."
  $ShortSha = $null
  if ($Version -eq "latest") {
    try {
      $builds = Invoke-RestMethod -Uri "$SiteBase/builds.json" -ErrorAction Stop
    } catch {
      try {
        $builds = Invoke-RestMethod -Uri "$PagesBase/builds.json" -ErrorAction Stop
      } catch {
        Write-Output "Install Failed - could not fetch builds.json"
        return 1
      }
    }
    if ($builds -is [Array] -and $builds.Count -gt 0) {
      $ShortSha = $builds[0].short_sha
    }
  } else {
    $ShortSha = $Version
  }

  if (-not $ShortSha) {
    Write-Output "Install Failed - could not determine build sha"
    return 1
  }

  $URL = "$PagesBase/downloads/$ShortSha/$Artifact/rts.exe"
  $ExePath = "${RtsBin}\rts.exe"

  Write-Output "Downloading rts.exe ($ShortSha) for $Artifact..."

  if (-not $DownloadWithoutCurl) {
    curl.exe "-#SfLo" "$ExePath" "$URL"
  }
  if ($DownloadWithoutCurl -or ($LASTEXITCODE -ne 0)) {
    Write-Warning "curl download failed (code ${LASTEXITCODE}). Trying Invoke-RestMethod..."
    try {
      Invoke-RestMethod -Uri $URL -OutFile $ExePath
    } catch {
      Write-Output "Install Failed - could not download $URL"
      return 1
    }
  }

  if (!(Test-Path $ExePath)) {
    Write-Output "Install Failed - $ExePath does not exist after download. Antivirus?"
    return 1
  }

  $C_RESET = [char]27 + "[0m"
  $C_GREEN = [char]27 + "[1;32m"

  Write-Output "${C_GREEN}RTS ($ShortSha) was installed successfully!${C_RESET}"
  Write-Output "The binary is located at $ExePath`n"

  $hasExistingOther = $false
  try {
    $existing = Get-Command rts -ErrorAction Stop
    if ($existing.Source -ne $ExePath) {
      Write-Warning "Note: Another rts.exe is already in %PATH% at $($existing.Source)`n"
      $hasExistingOther = $true
    }
  } catch {}

  if (-not $NoRegisterInstallation) {
    try {
      $RegistryKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\RTS"
      New-Item -Path $RegistryKey -Force | Out-Null
      New-ItemProperty -Path $RegistryKey -Name "DisplayName" -Value "RTS" -PropertyType String -Force | Out-Null
      New-ItemProperty -Path $RegistryKey -Name "InstallLocation" -Value "${RtsRoot}" -PropertyType String -Force | Out-Null
      New-ItemProperty -Path $RegistryKey -Name "DisplayIcon" -Value $ExePath -PropertyType String -Force | Out-Null
      New-ItemProperty -Path $RegistryKey -Name "DisplayVersion" -Value $ShortSha -PropertyType String -Force | Out-Null
    } catch { }
  }

  if (-not $hasExistingOther) {
    $Path = (Get-Env -Key "Path") -split ';'
    if ($Path -notcontains $RtsBin) {
      if (-not $NoPathUpdate) {
        $Path += $RtsBin
        Write-Env -Key 'Path' -Value ($Path -join ';')
        $env:PATH = $Path -join ';'
      } else {
        Write-Output "Skipping adding '${RtsBin}' to the user's %PATH%`n"
      }
    }
    Write-Output "To get started, restart your terminal and type `"rts`"`n"
  }

  $LASTEXITCODE = 0
}

Install-Rts -Version $Version

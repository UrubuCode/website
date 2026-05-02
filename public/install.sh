#!/usr/bin/env bash
set -euo pipefail

# RTS installer for Linux and macOS
# Usage: curl -fsSL https://urubucode.github.io/website/install.sh | bash

platform=$(uname -ms)

Color_Off=''
Red=''
Green=''
Dim=''
Bold_White=''
Bold_Green=''

if [[ -t 1 ]]; then
    Color_Off='\033[0m'
    Red='\033[0;31m'
    Green='\033[0;32m'
    Dim='\033[0;2m'
    Bold_Green='\033[1;32m'
    Bold_White='\033[1m'
fi

error() { echo -e "${Red}error${Color_Off}:" "$@" >&2; exit 1; }
info()  { echo -e "${Dim}$@ ${Color_Off}"; }
info_bold() { echo -e "${Bold_White}$@ ${Color_Off}"; }
success() { echo -e "${Green}$@ ${Color_Off}"; }

command -v curl >/dev/null || error 'curl is required to install rts'

case $platform in
'Darwin arm64')        artifact='rts-macOS-ARM64';   file='rts' ;;
'Darwin x86_64')       artifact='rts-macOS-X64';     file='rts' ;;
'Linux x86_64')        artifact='rts-Linux-X64';     file='rts' ;;
'Linux aarch64' | 'Linux arm64') artifact='rts-Linux-ARM64'; file='rts' ;;
*) error "Unsupported platform: $platform" ;;
esac

PAGES_BASE="${RTS_PAGES:-https://urubucode.github.io/rts}"
SITE_BASE="${RTS_SITE:-https://urubucode.github.io/website}"

info "Fetching latest RTS build metadata..."
builds_json=$(curl -fsSL "$SITE_BASE/builds.json" 2>/dev/null) \
  || builds_json=$(curl -fsSL "$PAGES_BASE/builds.json") \
  || error "Failed to download builds.json"

# Extract the first (latest) short_sha using a tiny python/awk fallback
short_sha=$(echo "$builds_json" | grep -o '"short_sha"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
[[ -n "$short_sha" ]] || error "Could not determine latest build sha"

url="$PAGES_BASE/downloads/$short_sha/$artifact/$file"

install_dir="${RTS_INSTALL:-$HOME/.rts}"
bin_dir="$install_dir/bin"
exe="$bin_dir/rts"

mkdir -p "$bin_dir" || error "Failed to create $bin_dir"

info "Downloading $artifact ($short_sha)..."
curl --fail --location --progress-bar --output "$exe" "$url" \
    || error "Failed to download rts from $url"

chmod +x "$exe" || error 'Failed to set permissions on rts executable'

tildify() {
    if [[ $1 = $HOME/* ]]; then echo "~/${1#$HOME/}"; else echo "$1"; fi
}

success "rts ($short_sha) was installed successfully to $Bold_Green$(tildify "$exe")"

if command -v rts >/dev/null 2>&1 && [[ "$(command -v rts)" = "$exe" ]]; then
    echo "Run 'rts --help' to get started"
    exit 0
fi

tilde_bin_dir=$(tildify "$bin_dir")
quoted_install_dir=\"${install_dir//\"/\\\"}\"
if [[ $quoted_install_dir = \"$HOME/* ]]; then
    quoted_install_dir=${quoted_install_dir/$HOME\//\$HOME/}
fi

install_env=RTS_INSTALL
bin_env="\$$install_env/bin"

add_to_config() {
    local config="$1"
    local prefix="$2"
    if [[ -w $config || ! -e $config ]]; then
        {
            echo ''
            echo '# rts'
            echo "${prefix}export $install_env=$quoted_install_dir"
            echo "${prefix}export PATH=\"$bin_env:\$PATH\""
        } >>"$config"
        info "Added \"$tilde_bin_dir\" to \$PATH in \"$(tildify "$config")\""
        return 0
    fi
    return 1
}

refresh_command=''
case $(basename "${SHELL:-bash}") in
fish)
    fish_config="$HOME/.config/fish/config.fish"
    mkdir -p "$(dirname "$fish_config")"
    if [[ -w $fish_config || ! -e $fish_config ]]; then
        {
            echo ''
            echo '# rts'
            echo "set --export $install_env $quoted_install_dir"
            echo "set --export PATH $bin_env \$PATH"
        } >>"$fish_config"
        info "Added \"$tilde_bin_dir\" to \$PATH in \"$(tildify "$fish_config")\""
        refresh_command="source $(tildify "$fish_config")"
    fi
    ;;
zsh)
    add_to_config "$HOME/.zshrc" "" && refresh_command="exec $SHELL"
    ;;
bash)
    for c in "$HOME/.bashrc" "$HOME/.bash_profile"; do
        if add_to_config "$c" ""; then
            refresh_command="source $c"
            break
        fi
    done
    ;;
*)
    echo 'Manually add the directory to your shell config:'
    info_bold "  export $install_env=$quoted_install_dir"
    info_bold "  export PATH=\"$bin_env:\$PATH\""
    ;;
esac

echo
info "To get started, run:"
echo
[[ -n $refresh_command ]] && info_bold "  $refresh_command"
info_bold "  rts --help"

#!/bin/bash
cd "$(dirname "$0")"

# Connect ResearchDrive if it isn't already (uses the password saved in Keychain).
if [ ! -d /Volumes/niedenthal ]; then
  echo "Connecting to ResearchDrive..."
  open "smb://research.drive.wisc.edu/niedenthal"
  for i in $(seq 1 60); do
    [ -d /Volumes/niedenthal ] && break
    sleep 1
  done
  [ -d /Volumes/niedenthal ] || echo "Could not connect to ResearchDrive. Is the VPN on?"
fi

python3 server.py

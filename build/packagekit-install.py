#!/usr/bin/env python3
"""Install a local .deb through PackageKit, the service Ubuntu App Center uses for
downloaded packages (no apt command line involved). Exit 0 only when PackageKit reports
success; any PackageKit error is printed."""
import sys
import gi
gi.require_version('PackageKitGlib', '1.0')
from gi.repository import PackageKitGlib as pk

client = pk.Client()
try:
    result = client.install_files(0, [sys.argv[1]], None, lambda *a: None, None)
except Exception as error:  # PackageKit reports dependency and package errors as GLib errors
    print('PackageKit error:', error)
    sys.exit(1)
code = result.get_exit_code()
print('PackageKit exit:', pk.ExitEnum.to_string(code))
error = result.get_error_code()
if error:
    print('PackageKit error:', error.get_details())
sys.exit(0 if code == pk.ExitEnum.SUCCESS else 1)

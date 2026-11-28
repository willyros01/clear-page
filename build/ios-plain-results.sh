#!/usr/bin/env bash
# Writes the iPhone/iPad simulator results in plain words onto the GitHub run's own page.
# Usage: ios-plain-results.sh <device name> <log files...>
device="$1"; shift
plain(){ case "$1" in
 testToolbarAndSaveVisibility) echo "Toolbar and Save button stay usable, also after turning the screen";;
 testProjectDestinationsAndClose) echo "Projects: where files are saved, and closing a project";;
 testProjectLayoutAccessibility) echo "Projects screen layout and its pop-up windows";;
 testFilenameMenuReturn) echo "File name in the Menu, then back to the editor";;
 testZPreviewAndNewCheckers) echo "HTML/Markdown Preview and the Java and other syntax checkers";;
 testModesAndProjects) echo "Basic / Advanced and Projects";;
 testTabsNativePickersAndRelaunch) echo "Tabs, the Files picker, and getting your files back after the app is closed";;
 testFirstUseTermsAndPersistence) echo "First-use Terms, Help, and keeping your text";;
 *) echo "$1";; esac; }
part(){ case "$1" in
 *project-focus*) echo "normal text size (Projects check)";;
 *large-text*) echo "largest text size";;
 *) echo "normal text size";; esac; }
{
 echo "## $device simulator checks"
 for log in "$@"; do
  [ -f "$log" ] || { echo "- Not run: $(part "$log")"; continue; }
  grep -Eo "Test Case '-\[ATEFunctionalTests\.ATEFunctionalTests test[A-Za-z]+\]' (passed|failed)" "$log" | while read -r line; do
   name=$(echo "$line" | sed -E 's/.* (test[A-Za-z]+)\].*/\1/'); result=$(echo "$line" | awk '{print $NF}')
   if [ "$result" = passed ]; then mark="Passed"; else mark="FAILED"; fi
   echo "- $mark — $(plain "$name") ($(part "$log"))"
  done
  grep -h "NOTE native UI:" "$log" | sed -E 's/.*NOTE native UI: /- Note: /' | sort -u
 done
} >> "${GITHUB_STEP_SUMMARY:-/dev/stdout}"

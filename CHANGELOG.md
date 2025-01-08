# Change Log

All notable changes to the "logboss" extension will be documented in this file.

## [1.0.0]

### Added
- Highlight console statements in active file
  - Temporarily highlights all console.log statements
  - Auto-removes highlighting after 5 seconds
- Remove console statements functionality
  - Removes both active and commented console statements
  - Works with single-line and multi-line comments
  - Preserves code formatting


## [0.0.8] - 2024-03-08

### Changed
- Merged highlight and remove highlight into a single toggle command
- Status bar icon now shows "Boss" instead of "LogBoss" for cleaner look
- Improved highlight state management across file switches
- Added automatic highlight cleanup when switching files
- Dynamic command description for toggle comments (shows "// Add comments" or "Remove //" based on state)
- Improved multi-line console statement detection and handling

### Fixed
- Fixed highlight state persistence when switching between files
- Fixed handling of multi-line console statements in comments
- Fixed comment toggle for console statements with trailing content
- Fixed regex patterns for more accurate console statement detection

### Removed
- Removed separate "Remove Highlighting" command in favor of toggle functionality
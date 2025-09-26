#!/bin/bash
# Clean and rebuild script for React Native iOS project

echo "Cleaning up iOS build artifacts..."
rm -rf Pods
rm -rf build
rm -f Podfile.lock

# Remove any leftover modulemap files that cause conflicts
find . -name "*React-jsitooling.modulemap" -exec rm -f {} \;
find . -name "*ReactCommon.modulemap" -exec rm -f {} \;

# Clean Xcode derived data (optional, uncomment if needed)
# rm -rf ~/Library/Developer/Xcode/DerivedData

echo "Installing pods..."
pod install

echo "Done! Now go back to the root directory and run 'yarn ios'"

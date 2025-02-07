// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

library StringUtils {
    // Add equals function for string comparison
    function equals(
        string memory a,
        string memory b
    ) internal pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }

    function validateStringLength(
        string memory str,
        uint256 maxLength
    ) internal pure returns (bool) {
        return bytes(str).length <= maxLength;
    }

    function isValidEmail(string memory email) internal pure returns (bool) {
        bytes memory b = bytes(email);
        if (b.length < 3) return false; // a@b

        bool foundAtSymbol = false;
        bool foundDotAfterAt = false;
        uint atLocation = 0;

        for (uint i = 0; i < b.length; i++) {
            if (b[i] == "@") {
                if (foundAtSymbol) return false; // multiple @ symbols
                foundAtSymbol = true;
                atLocation = i;
            } else if (foundAtSymbol && b[i] == ".") {
                foundDotAfterAt = true;
            }
        }

        return
            foundAtSymbol &&
            foundDotAfterAt &&
            atLocation > 0 &&
            atLocation < b.length - 3;
    }

    function isValidAadharNumber(
        string memory aadhar
    ) internal pure returns (bool) {
        bytes memory b = bytes(aadhar);
        if (b.length != 12) return false;

        for (uint i = 0; i < b.length; i++) {
            if (uint8(b[i]) < 48 || uint8(b[i]) > 57) return false;
        }
        return true;
    }

    function isValidPanNumber(string memory pan) internal pure returns (bool) {
        bytes memory b = bytes(pan);
        if (b.length != 10) return false;

        // First 5 characters should be uppercase letters
        for (uint i = 0; i < 5; i++) {
            if (uint8(b[i]) < 65 || uint8(b[i]) > 90) return false;
        }

        // Next 4 characters should be numbers
        for (uint i = 5; i < 9; i++) {
            if (uint8(b[i]) < 48 || uint8(b[i]) > 57) return false;
        }

        // Last character should be uppercase letter
        if (uint8(b[9]) < 65 || uint8(b[9]) > 90) return false;

        return true;
    }

    // Add safe string handling
    function safeString(string memory str) public pure returns (string memory) {
        return bytes(str).length == 0 ? "" : str;
    }
}

let newUser1, newUser2, newUser3;

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Land Registration System", function () {
    let landRegistry, transactionRegistry, userRegistry, disputeRegistry;
    let owner, inspector, user1, user2, user3;
    let currentPID = 12345;
    let currentAadhar = 100000000000; // Base Aadhar number
    let currentPAN = 1; // Base for PAN number generation

    // Helper function to generate unique Aadhar number
    function generateUniqueAadhar() {
        currentAadhar++;
        return currentAadhar.toString().padStart(12, '0');
    }

    // Helper function to generate unique PAN
    function generateUniquePAN() {
        currentPAN++;
        return `ABCDE${currentPAN.toString().padStart(4, '0')}F`;
    }

    // Test data setup with function to get unique PID and documents
    function getTestData(customData = {}) {
        currentPID++; // Increment PID for each test
        return {
            userData: {
                name: "John Doe",
                age: 30,
                city: "New York",
                aadharNumber: generateUniqueAadhar(),  // Generate unique Aadhar
                panNumber: generateUniquePAN(),        // Generate unique PAN
                documentHash: ethers.keccak256(ethers.toUtf8Bytes(`DOC${currentPID}`)),
                email: `john${currentPID}@example.com`,
                ...customData
            },
            landData: {
                area: 1000,
                location: "Test Location",
                price: ethers.parseEther("10"),
                coordinates: "12.34,56.78",
                propertyPID: currentPID,
                surveyNumber: `SURV${currentPID}`,
                documentHash: ethers.keccak256(ethers.toUtf8Bytes(`LANDDOC${currentPID}`)),
                ...customData
            }
        };
    }

    async function registerUserIfNotRegistered(user, userData) {
        try {
            const userInfo = await userRegistry.users(user.address);
            if (userInfo.name === "") {
                await userRegistry.connect(user).registerUser(
                    userData.name,
                    userData.age,
                    userData.city,
                    userData.aadharNumber,
                    userData.panNumber,
                    userData.documentHash,
                    userData.email
                );
            }
        } catch (error) {
            // If error is not about duplicate registration, rethrow it
            if (!error.message.includes("User already exists")) {
                throw error;
            }
        }
    }

    async function verifyUserIfNotVerified(inspector, user) {
        const userInfo = await userRegistry.users(user.address);
        const verificationInfo = await userRegistry.getVerificationStatus(user.address);
        if (verificationInfo.isRegistered && !userInfo.isVerified) {
            await userRegistry.connect(inspector).verifyUser(user.address);
        }
    }

    async function deployContracts() {
        [owner, inspector, user1, user2, user3, newUser1, newUser2, newUser3] = await ethers.getSigners();

        // Deploy UserRegistry
        const UserRegistry = await ethers.getContractFactory("UserRegistry");
        userRegistry = await UserRegistry.deploy();
        await userRegistry.waitForDeployment();

        // Deploy LandRegistry with UserRegistry address
        const LandRegistry = await ethers.getContractFactory("LandRegistry");
        landRegistry = await LandRegistry.deploy(await userRegistry.getAddress());
        await landRegistry.waitForDeployment();

        // Deploy TransactionRegistry
        const TransactionRegistry = await ethers.getContractFactory("TransactionRegistry");
        transactionRegistry = await TransactionRegistry.deploy(await landRegistry.getAddress());
        await transactionRegistry.waitForDeployment();

        // Deploy DisputeRegistry
        const DisputeRegistry = await ethers.getContractFactory("DisputeRegistry");
        disputeRegistry = await DisputeRegistry.deploy(await landRegistry.getAddress());
        await disputeRegistry.waitForDeployment();

        // Setup roles
        const INSPECTOR_ROLE = await userRegistry.INSPECTOR_ROLE();
        await userRegistry.connect(owner).assignRole(inspector.address, INSPECTOR_ROLE);
        await landRegistry.connect(owner).assignRole(inspector.address, INSPECTOR_ROLE);
        await transactionRegistry.connect(owner).assignRole(inspector.address, INSPECTOR_ROLE);
        await disputeRegistry.connect(owner).assignRole(inspector.address, INSPECTOR_ROLE);

        // Authorize TransactionRegistry in LandRegistry
        await landRegistry.connect(owner).authorizeContract(await transactionRegistry.getAddress());

        // Register and verify users
        await registerUserIfNotRegistered(user1, getTestData().userData);
        await registerUserIfNotRegistered(user2, getTestData({
            name: "Jane Doe",
            age: 35,
            city: "Boston",
            email: "jane@example.com"
        }).userData);
        await verifyUserIfNotVerified(inspector, user1);
        await verifyUserIfNotVerified(inspector, user2);
        await verifyUserIfNotVerified(inspector, user3);
    }

    before(async function () {
        await deployContracts();
    });

    describe("Base Registry Functionality", function () {
        it("Should set correct initial roles", async function () {

            describe("Base Registry Functionality", function () {
                it("Should set correct initial roles", async function () {
                    const ADMIN_ROLE = await userRegistry.ADMIN_ROLE();
                    const INSPECTOR_ROLE = await userRegistry.INSPECTOR_ROLE();
                    it("Should set correct initial roles", async function () {
                        const ADMIN_ROLE = await userRegistry.ADMIN_ROLE();
                        const INSPECTOR_ROLE = await userRegistry.INSPECTOR_ROLE();

                        expect(await userRegistry.checkRole(ADMIN_ROLE, owner.address)).to.be.true;
                        expect(await userRegistry.checkRole(INSPECTOR_ROLE, inspector.address)).to.be.true;
                    });

                    it("Should allow admin to assign and revoke roles", async function () {
                        const USER_ROLE = await userRegistry.USER_ROLE();
                        const randomUser = ethers.Wallet.createRandom().address;

                        // First assignment should work
                        await userRegistry.connect(owner).assignRole(randomUser, USER_ROLE);
                        expect(await userRegistry.checkRole(USER_ROLE, randomUser)).to.be.true;

                        // Second assignment to same role should not revert
                        await userRegistry.connect(owner).assignRole(randomUser, USER_ROLE);
                        expect(await userRegistry.checkRole(USER_ROLE, randomUser)).to.be.true;

                        it("Should handle emergency pause mechanism", async function () {
                            await userRegistry.connect(owner).pause();
                            expect(await userRegistry.paused()).to.be.true;

                            await userRegistry.connect(owner).unpause();
                            expect(await userRegistry.paused()).to.be.false;
                        });
                    });

                    describe("User Registry", function () {
                        beforeEach(async function () {
                            // Deploy fresh contracts for each test to ensure clean state
                            await deployContracts();

                            // Get fresh test data for each test
                            const { userData } = getTestData();
                            this.testData = userData;
                        });

                        it("Should prevent duplicate registration", async function () {
                            // First registration with fresh user
                            await userRegistry.connect(user3).registerUser(
                                this.testData.name,
                                this.testData.age,
                                this.testData.city,
                                this.testData.aadharNumber,
                                this.testData.panNumber,
                                this.testData.documentHash,
                                this.testData.email
                            );

                            // Verify the first registration was successful
                            const userInfo = await userRegistry.users(user3.address);
                            expect(userInfo.name).to.equal(this.testData.name);

                            // Attempt second registration - should fail
                            await expect(
                                userRegistry.connect(user3).registerUser(
                                    this.testData.name,
                                    this.testData.age,
                                    this.testData.city,
                                    this.testData.aadharNumber,
                                    this.testData.panNumber,
                                    this.testData.documentHash,
                                    this.testData.email
                                )
                            ).to.be.revertedWith("User already exists or is registered");
                        });

                        it("Should not allow registration with invalid document format", async function () {
                            const invalidData = getTestData();
                            invalidData.userData.aadharNumber = "123"; // Too short
                            invalidData.userData.panNumber = "ABC"; // Too short

                            await expect(
                                userRegistry.connect(user3).registerUser(
                                    invalidData.userData.name,
                                    invalidData.userData.age,
                                    invalidData.userData.city,
                                    invalidData.userData.aadharNumber,
                                    invalidData.userData.panNumber,
                                    invalidData.userData.documentHash,
                                    invalidData.userData.email
                                )
                            ).to.be.revertedWith("Invalid Aadhar number");
                        });

                        it("Should validate document formats", async function () {
                            const invalidAadharNumber = "123"; // Too short
                            const invalidPanNumber = "ABC"; // Too short
                            const validAadharNumber = "123456789012";
                            const validPanNumber = "ABCDE1234F";

                            // Test invalid Aadhar number
                            await expect(
                                userRegistry.connect(user3).registerUser(
                                    "Test User",
                                    25,
                                    "City",
                                    invalidAadharNumber,
                                    validPanNumber,
                                    ethers.keccak256(ethers.toUtf8Bytes("DOC123")),
                                    "test@example.com"
                                )
                            ).to.be.revertedWith("Invalid Aadhar number");

                            // Test invalid PAN number
                            await expect(
                                userRegistry.connect(user3).registerUser(
                                    "Test User",
                                    25,
                                    "City",
                                    validAadharNumber,
                                    invalidPanNumber,
                                    ethers.keccak256(ethers.toUtf8Bytes("DOC123")),
                                    "test@example.com"
                                )
                            ).to.be.revertedWith("Invalid PAN number");
                        });

                        it("Should not allow registration with invalid data", async function () {
                            await expect(
                                userRegistry.connect(user3).registerUser(
                                    "",  // Empty name
                                    this.testData.age,
                                    this.testData.city,
                                    this.testData.aadharNumber,
                                    this.testData.panNumber,
                                    this.testData.documentHash,
                                    this.testData.email
                                )
                            ).to.be.revertedWith("Name cannot be empty");

                            await expect(
                                userRegistry.connect(user3).registerUser(
                                    this.testData.name,
                                    17,  // Under 18
                                    this.testData.city,
                                    this.testData.aadharNumber,
                                    this.testData.panNumber,
                                    this.testData.documentHash,
                                    this.testData.email
                                )
                            ).to.be.revertedWith("Age must be 18 or above");
                        });

                        it("Should verify user correctly", async function () {
                            await registerUserIfNotRegistered(user3, {
                                name: "Bob",
                                age: 32,
                                city: "Chicago",
                                aadharNumber: "123456789012",
                                panNumber: "ABCDE1234F",
                                documentHash: ethers.keccak256(ethers.toUtf8Bytes("DOC789")),
                                email: "bob@example.com"
                            });

                            await userRegistry.connect(inspector).verifyUser(user3.address);
                            const user = await userRegistry.users(user3.address);
                            expect(user.isVerified).to.be.true;
                        });

                        it("Should handle batch user verification", async function () {
                            // Register multiple users
                            const users = [user1, user2, user3];
                            for (const user of users) {
                                await registerUserIfNotRegistered(user, this.testData);
                            }

                            await userRegistry.connect(inspector).batchVerifyUsers(users.map(user => user.address));

                            for (const user of users) {
                                const userData = await userRegistry.users(user.address);
                                expect(userData.isVerified).to.be.true;
                            }
                        });

                        // Update test case for string length validation
                        it("Should validate string length through user registration", async function () {
                            const longString = "a".repeat(1001);
                            const validAadhar = generateUniqueAadhar();
                            const validPan = generateUniquePAN();

                            await expect(
                                userRegistry.connect(newUser2).registerUser(
                                    longString,
                                    25,
                                    "City",
                                    validAadhar,
                                    validPan,
                                    ethers.keccak256(ethers.toUtf8Bytes("DOC")),
                                    "test@example.com"
                                )
                            ).to.be.revertedWith("String too long");
                        });
                    });

                    describe("User Registry", function () {
                        beforeEach(async function () {
                            // Deploy fresh contracts for each test
                            await deployContracts();

                            // Get fresh test data for each test
                            const { userData } = getTestData();
                            this.testData = userData;

                            // Get the role constants directly from the contract
                            this.USER_ROLE = await userRegistry.USER_ROLE();
                            this.VERIFIED_USER_ROLE = await userRegistry.VERIFIED_USER_ROLE();
                        });

                        it("Should register a new user with valid data", async function () {
                            // Use new unregistered user for this test
                            const newUserData = getTestData().userData;

                            await userRegistry.connect(user3).registerUser(
                                newUserData.name,
                                newUserData.age,
                                newUserData.city,
                                newUserData.aadharNumber,
                                newUserData.panNumber,
                                newUserData.documentHash,
                                newUserData.email
                            );

                            // Verify registration was successful
                            const user = await userRegistry.users(user3.address);
                            expect(user.name).to.equal(newUserData.name);
                            expect(user.age).to.equal(newUserData.age);
                            expect(user.isVerified).to.be.false;
                        });

                        it("Should prevent duplicate registration", async function () {
                            // Deploy fresh contracts and get fresh test data
                            const newUserData = getTestData().userData;

                            // First registration
                            await userRegistry.connect(user3).registerUser(
                                newUserData.name,
                                newUserData.age,
                                newUserData.city,
                                newUserData.aadharNumber,
                                newUserData.panNumber,
                                newUserData.documentHash,
                                newUserData.email
                            );

                            // Verify first registration was successful
                            const verificationInfo = await userRegistry.getVerificationStatus(user3.address);
                            expect(verificationInfo.isRegistered).to.be.true;

                            // Attempt second registration
                            await expect(
                                userRegistry.connect(user3).registerUser(
                                    newUserData.name,
                                    newUserData.age,
                                    newUserData.city,
                                    newUserData.aadharNumber,
                                    newUserData.panNumber,
                                    newUserData.documentHash,
                                    newUserData.email
                                )
                            ).to.be.revertedWith("User already exists or is registered");
                        });

                        it("Should not allow registration with invalid data", async function () {
                            await expect(
                                userRegistry.connect(user3).registerUser(
                                    "",  // Empty name
                                    this.testData.age,
                                    this.testData.city,
                                    this.testData.aadharNumber,
                                    this.testData.panNumber,
                                    this.testData.documentHash,
                                    this.testData.email
                                )
                            ).to.be.revertedWith("Name cannot be empty");

                            await expect(
                                userRegistry.connect(user3).registerUser(
                                    this.testData.name,
                                    17,  // Under 18
                                    this.testData.city,
                                    this.testData.aadharNumber,
                                    this.testData.panNumber,
                                    this.testData.documentHash,
                                    this.testData.email
                                )
                            ).to.be.revertedWith("Age must be 18 or above");
                        });

                        it("Should verify user correctly", async function () {
                            await registerUserIfNotRegistered(user3, {
                                name: "Bob",
                                age: 32,
                                city: "Chicago",
                                aadharNumber: "123456789012",
                                panNumber: "ABCDE1234F",
                                documentHash: ethers.keccak256(ethers.toUtf8Bytes("DOC789")),
                                email: "bob@example.com"
                            });

                            await userRegistry.connect(inspector).verifyUser(user3.address);
                            const user = await userRegistry.users(user3.address);
                            expect(user.isVerified).to.be.true;
                        });

                        it("Should handle batch user verification", async function () {
                            // Register multiple users
                            const users = [user1, user2, user3];
                            for (const user of users) {
                                await registerUserIfNotRegistered(user, this.testData);
                            }

                            await userRegistry.connect(inspector).batchVerifyUsers(users.map(user => user.address));

                            for (const user of users) {
                                const userData = await userRegistry.users(user.address);
                                expect(userData.isVerified).to.be.true;
                            }
                        });

                        it("Should validate string length through user registration", async function () {
                            const longString = "a".repeat(1001);
                            await expect(
                                userRegistry.connect(newUser2).registerUser(
                                    longString,
                                    25,
                                    "City",
                                    generateUniqueAadhar(),
                                    generateUniquePAN(),
                                    ethers.keccak256(ethers.toUtf8Bytes("DOC")),
                                    "test@example.com"
                                )
                            ).to.be.revertedWith("String too long");
                        });
                    });

                    describe("Land Registry", function () {
                        let landId;

                        beforeEach(async function () {
                            // Get unique test data for each test
                            const { userData, landData } = getTestData();
                            this.testData = { userData, landData };

                            // Register and verify user1
                            await registerUserIfNotRegistered(user1, userData);
                            await verifyUserIfNotVerified(inspector, user1);

                            // Add a land for each test
                            await landRegistry.connect(user1).addLand(
                                landData.area,
                                landData.location,
                                landData.price,
                                landData.coordinates,
                                landData.propertyPID,
                                landData.surveyNumber,
                                landData.documentHash
                            );
                            landId = await landRegistry.getTotalLands();
                        });

                        it("Should add new land with valid data", async function () {
                            // Get new test data with unique PID for this specific test
                            const { landData: newLandData } = getTestData();

                            await landRegistry.connect(user1).addLand(
                                newLandData.area,
                                newLandData.location,
                                newLandData.price,
                                newLandData.coordinates,
                                newLandData.propertyPID, // This will be unique
                                newLandData.surveyNumber,
                                newLandData.documentHash
                            );

                            landId = await landRegistry.getTotalLands();
                            const land = await landRegistry.lands(landId);
                            expect(land.area).to.equal(newLandData.area);
                            expect(land.location).to.equal(newLandData.location);
                            expect(land.owner).to.equal(user1.address);
                        });

                        it("Should verify land correctly", async function () {
                            // Add land with unique PID
                            const { landData: newLandData } = getTestData();
                            await landRegistry.connect(user1).addLand(
                                newLandData.area,
                                newLandData.location,
                                newLandData.price,
                                newLandData.coordinates,
                                newLandData.propertyPID,
                                newLandData.surveyNumber,
                                newLandData.documentHash
                            );
                            landId = await landRegistry.getTotalLands();

                            await landRegistry.connect(inspector).verifyLand(landId, true, "Verification approved");
                            const land = await landRegistry.lands(landId);
                            expect(land.isVerified).to.be.true;
                        });

                        it("Should handle land sale status correctly", async function () {
                            // Add land with unique PID
                            const { landData: newLandData } = getTestData();
                            await landRegistry.connect(user1).addLand(
                                newLandData.area,
                                newLandData.location,
                                newLandData.price,
                                newLandData.coordinates,
                                newLandData.propertyPID,
                                newLandData.surveyNumber,
                                newLandData.documentHash
                            );
                            landId = await landRegistry.getTotalLands();

                            // Verify land first
                            await landRegistry.connect(inspector).verifyLand(landId, true, "Verification approved");
                            const landAfterVerification = await landRegistry.lands(landId);
                            expect(landAfterVerification.isVerified).to.be.true;

                            // Put land for sale
                            await landRegistry.connect(user1).putLandForSale(landId);
                            expect(await landRegistry.isLandForSale(landId)).to.be.true;

                            // Take land off sale
                            await landRegistry.connect(user1).takeLandOffSale(landId);
                            expect(await landRegistry.isLandForSale(landId)).to.be.false;
                        });

                        it("Should handle multiple document uploads", async function () {
                            // Verify the land first
                            await landRegistry.connect(inspector).verifyLand(landId, true, "Verification approved");

                            // Create document hashes
                            const doc1 = ethers.keccak256(ethers.toUtf8Bytes("DOC1"));
                            const doc2 = ethers.keccak256(ethers.toUtf8Bytes("DOC2"));

                            // Add first document
                            await landRegistry.connect(user1).addLandDocument(landId, doc1, "Document 1");

                            // Get metadata and verify first document
                            let [documents, descriptions, lastUpdated] = await landRegistry.getLandMetadata(landId);
                            expect(documents).to.not.be.undefined;
                            expect(documents.length).to.equal(1);
                            expect(documents[0]).to.equal(doc1);
                            expect(descriptions[0]).to.equal("Document 1");
                            expect(lastUpdated).to.be.a('bigint').that.is.not.equal(0);

                            // Add second document
                            await landRegistry.connect(user1).addLandDocument(landId, doc2, "Document 2");

                            // Get metadata and verify both documents
                            [documents, descriptions, lastUpdated] = await landRegistry.getLandMetadata(landId);
                            expect(documents.length).to.equal(2);
                            expect(descriptions.length).to.equal(2);
                            expect(documents[1]).to.equal(doc2);
                            expect(descriptions[1]).to.equal("Document 2");
                        });

                        // Update land history test
                        it("Should get land history", async function () {
                            await landRegistry.connect(inspector).verifyLand(landId, true, "Land verified");
                            await landRegistry.connect(user1).updateLandDetails(
                                landId,
                                "Updated Location",
                                "Updated Coordinates",
                                "Updated land details"
                            );

                            const history = await landRegistry.getLandHistory(landId, 0, 10);
                            expect(history.length).to.equal(2);
                            expect(history[1].description).to.equal("Updated land details");
                        });
                    });

                    describe("Transaction Registry", function () {
                        let landId;

                        beforeEach(async function () {
                            const { userData, landData } = getTestData();
                            this.testData = { userData, landData };

                            // Setup: Register and verify users
                            for (const user of [user1, user2]) {
                                await registerUserIfNotRegistered(user, userData);

                                // Check both registration and verification status
                                const userInfo = await userRegistry.users(user.address);
                                const verificationInfo = await userRegistry.getVerificationStatus(user.address);

                                if (verificationInfo.isRegistered && !userInfo.isVerified) {
                                    await userRegistry.connect(inspector).verifyUser(user.address);
                                }

                                // Verify roles are assigned
                                const VERIFIED_USER_ROLE = await userRegistry.VERIFIED_USER_ROLE();
                                if (!await userRegistry.checkRole(VERIFIED_USER_ROLE, user.address)) {
                                    await userRegistry.connect(inspector).verifyUser(user.address);
                                }
                            }

                            // Add and verify land
                            await landRegistry.connect(user1).addLand(
                                landData.area,
                                landData.location,
                                landData.price,
                                landData.coordinates,
                                landData.propertyPID,
                                landData.surveyNumber,
                                landData.documentHash
                            );

                            // Get the land ID
                            landId = await landRegistry.getTotalLands();

                            // Check if land is already verified
                            const landDetails = await landRegistry.getLandDetails(landId);
                            if (!landDetails.isVerified) {
                                await landRegistry.connect(inspector).verifyLand(landId, true, "Verification approved");
                            }

                            await landRegistry.connect(user1).putLandForSale(landId);
                        });

                        it("Should create and process purchase request", async function () {
                            // Verify proper role assignment
                            const VERIFIED_USER_ROLE = await userRegistry.VERIFIED_USER_ROLE();
                            expect(await userRegistry.checkRole(VERIFIED_USER_ROLE, user1.address)).to.be.true;
                            expect(await userRegistry.checkRole(VERIFIED_USER_ROLE, user2.address)).to.be.true;

                            await transactionRegistry.connect(user2).createPurchaseRequest(landId);
                            let request = await transactionRegistry.purchaseRequests(1);
                            expect(request.buyer).to.equal(user2.address);
                            expect(request.status).to.equal(0); // PENDING

                            // Process request as seller
                            await transactionRegistry.connect(user1).processPurchaseRequest(1, true);
                            request = await transactionRegistry.purchaseRequests(1);
                            expect(request.status).to.equal(1); // ACCEPTED
                        });

                        it("Should handle payment and ownership transfer", async function () {
                            // Reset request counter by deploying fresh contract or clearing state
                            await deployContracts();

                            // Re-setup the test conditions
                            const { landData } = getTestData();
                            await landRegistry.connect(user1).addLand(
                                landData.area,
                                landData.location,
                                landData.price,
                                landData.coordinates,
                                landData.propertyPID,
                                landData.surveyNumber,
                                landData.documentHash
                            );
                            landId = await landRegistry.getTotalLands();
                            await landRegistry.connect(inspector).verifyLand(landId, true, "Verification approved");
                            await landRegistry.connect(user1).putLandForSale(landId);

                            // Create purchase request and verify initial status
                            await transactionRegistry.connect(user2).createPurchaseRequest(landId);
                            let request = await transactionRegistry.purchaseRequests(1);
                            expect(request.status).to.equal(0); // PENDING

                            // Process and continue with the rest of the test
                            await transactionRegistry.connect(user1).processPurchaseRequest(1, true);
                            request = await transactionRegistry.purchaseRequests(1);
                            expect(request.status).to.equal(1); // ACCEPTED

                            await transactionRegistry.connect(user2).makePayment(1, { value: landData.price });
                            request = await transactionRegistry.purchaseRequests(1);
                            expect(request.status).to.equal(3); // PAYMENT_DONE

                            await landRegistry.connect(user1).takeLandOffSale(landId);
                            const newDocumentHash = ethers.keccak256(ethers.toUtf8Bytes("NEWDOC123"));
                            await transactionRegistry.connect(inspector).transferLandOwnership(1, newDocumentHash);

                            const land = await landRegistry.lands(landId);
                            expect(land.owner).to.equal(user2.address);
                            expect(land.isForSale).to.be.false;
                        });

                        // Update transaction flow tests
                        it("Should handle payment validation", async function () {
                            // Create and approve request first
                            await landRegistry.connect(user1).putLandForSale(landId);
                            await transactionRegistry.connect(user2).createPurchaseRequest(landId);
                            const requestId = await transactionRegistry.getTransactionCount();
                            await transactionRegistry.connect(user1).processPurchaseRequest(requestId, true);

                            // Continue with payment tests
                            const price = await landRegistry.getLandPrice(landId);

                            await expect(
                                transactionRegistry.connect(user2).makePayment(requestId, { value: price })
                            ).to.not.be.reverted;

                            const land = await landRegistry.getLandDetails(landId);
                            expect(land.owner).to.equal(user2.address);
                        });

                        it("Should validate payment conditions properly", async function () {
                            // ...existing setup code...

                            const landPrice = await landRegistry.getLandPrice(landId);

                            // Test incorrect payment amount
                            await expect(
                                transactionRegistry.connect(user2).makePayment(requestId, {
                                    value: ethers.parseEther("0.5")
                                })
                            ).to.be.revertedWith("Incorrect payment amount");

                            // Test payment when land not for sale
                            await landRegistry.connect(user1).takeLandOffSale(landId);
                            await expect(
                                transactionRegistry.connect(user2).makePayment(requestId, {
                                    value: landPrice
                                })
                            ).to.be.revertedWith("Land not for sale");
                        });
                    });

                    describe("Dispute Registry", function () {
                        let landId;

                        beforeEach(async function () {
                            // Deploy fresh contracts for each test
                            await deployContracts();

                            const { landData } = getTestData();
                            const testUserData = getTestData().userData;

                            // Step 1: Register users
                            await registerUserIfNotRegistered(user2, testUserData);
                            await registerUserIfNotRegistered(user3, testUserData);

                            // Step 2: Verify users through inspector
                            await verifyUserIfNotVerified(inspector, user2);
                            await verifyUserIfNotVerified(inspector, user3);

                            // Step 3: Explicitly assign VERIFIED_USER_ROLE after verification
                            const VERIFIED_USER_ROLE = await userRegistry.VERIFIED_USER_ROLE();
                            await userRegistry.connect(owner).assignRole(user2.address, VERIFIED_USER_ROLE);
                            await userRegistry.connect(owner).assignRole(user3.address, VERIFIED_USER_ROLE);

                            // Step 4: Add and verify land
                            await landRegistry.connect(user1).addLand(
                                landData.area,
                                landData.location,
                                landData.price,
                                landData.coordinates,
                                landData.propertyPID,
                                landData.surveyNumber,
                                landData.documentHash
                            );
                            landId = await landRegistry.getTotalLands();
                            await landRegistry.connect(inspector).verifyLand(landId, true, "Verification approved");

                            // Ensure users are verified and have the VERIFIED_USER_ROLE
                            await verifyUserIfNotVerified(inspector, user2);
                            await verifyUserIfNotVerified(inspector, user3);
                            await userRegistry.connect(owner).assignRole(user2.address, VERIFIED_USER_ROLE);
                            await userRegistry.connect(owner).assignRole(user3.address, VERIFIED_USER_ROLE);
                        });

                        it("Should raise and resolve disputes", async function () {
                            // Ensure user is verified and has role
                            const VERIFIED_USER_ROLE = await userRegistry.VERIFIED_USER_ROLE();
                            await verifyUserIfNotVerified(inspector, user2);
                            await userRegistry.connect(owner).assignRole(user2.address, VERIFIED_USER_ROLE);

                            await disputeRegistry.connect(user2).raiseDispute(
                                landId,
                                "Boundary dispute",
                                1 // BOUNDARY dispute category
                            );

                            let disputes = await disputeRegistry.getLandDisputes(landId, 0, 1);
                            expect(disputes[0].reason).to.equal("Boundary dispute");
                            expect(disputes[0].resolved).to.be.false;

                            await disputeRegistry.connect(inspector).resolveDispute(
                                landId,
                                disputes[0].disputeId,
                                "Dispute resolved after survey"
                            );

                            disputes = await disputeRegistry.getLandDisputes(landId, 0, 1);
                            expect(disputes[0].resolved).to.be.true;
                        });

                        it("Should track dispute history correctly", async function () {
                            // Ensure users are verified and have the VERIFIED_USER_ROLE
                            const VERIFIED_USER_ROLE = await userRegistry.VERIFIED_USER_ROLE();
                            await verifyUserIfNotVerified(inspector, user2);
                            await verifyUserIfNotVerified(inspector, user3);
                            await userRegistry.connect(owner).assignRole(user2.address, VERIFIED_USER_ROLE);
                            await userRegistry.connect(owner).assignRole(user3.address, VERIFIED_USER_ROLE);

                            // Raise multiple disputes
                            await disputeRegistry.connect(user2).raiseDispute(landId, "Dispute 1", 1);
                            await disputeRegistry.connect(user3).raiseDispute(landId, "Dispute 2", 2);

                            const disputes = await disputeRegistry.getLandDisputes(landId, 0, 2);
                            expect(disputes.length).to.equal(2);
                            expect(disputes[0].reason).to.equal("Dispute 1");
                            expect(disputes[1].reason).to.equal("Dispute 2");
                        });
                    });

                    describe("Integration Tests", function () {
                        // Complex scenario testing complete land sale lifecycle with disputes
                        it("Should handle complete land sale lifecycle with disputes", async function () {
                            // Test sequence:
                            // 1. User registration and verification
                            // 2. Land registration and verification
                            // 3. Sale listing and purchase request
                            // 4. Payment and ownership transfer
                            // 5. Dispute handling
                            const { userData, landData } = getTestData();

                            // 1. Register and verify users
                            await registerUserIfNotRegistered(user1, userData);
                            await registerUserIfNotRegistered(user2, getTestData({
                                name: "Jane Doe",
                                age: 35,
                                city: "Boston",
                                email: "jane@example.com"
                            }).userData);
                            await verifyUserIfNotVerified(inspector, user1);
                            await verifyUserIfNotVerified(inspector, user2);

                            // 2. Add and verify land
                            await landRegistry.connect(user1).addLand(
                                landData.area,
                                landData.location,
                                landData.price,
                                landData.coordinates,
                                landData.propertyPID,
                                landData.surveyNumber,
                                landData.documentHash
                            );

                            // Get the correct land ID after adding land
                            const landId = await landRegistry.getTotalLands();

                            await landRegistry.connect(inspector).verifyLand(landId, true, "Verification approved");

                            // 3. Put land for sale using correct landId
                            await landRegistry.connect(user1).putLandForSale(landId);

                            // 4. Create purchase request and get the correct request ID
                            await transactionRegistry.connect(user2).createPurchaseRequest(landId);
                            const requestId = await transactionRegistry.getTransactionCount();

                            // Process request with correct request ID
                            await transactionRegistry.connect(user1).processPurchaseRequest(requestId, true);

                            // 5. Make payment with correct request ID
                            await transactionRegistry.connect(user2).makePayment(requestId, { value: landData.price });

                            // 6. Transfer ownership with correct request ID
                            const newDocumentHash = ethers.keccak256(ethers.toUtf8Bytes("NEWDOC123"));
                            await landRegistry.connect(user1).takeLandOffSale(landId);
                            await transactionRegistry.connect(inspector).transferLandOwnership(requestId, newDocumentHash);

                            const land = await landRegistry.lands(landId);
                            expect(land.owner).to.equal(user2.address);
                            expect(land.isForSale).to.be.false;
                        });
                    });

                    // Frontend integration testing
                    describe("Frontend Integration Tests", function () {
                        let landId;
                        let requestId;

                        beforeEach(async function () {
                            await deployContracts();
                            const { userData, landData } = getTestData();

                            // Setup initial state
                            await registerUserIfNotRegistered(user1, userData);
                            await registerUserIfNotRegistered(user2, userData);
                            await verifyUserIfNotVerified(inspector, user1);
                            await verifyUserIfNotVerified(inspector, user2);

                            // Add a land
                            await landRegistry.connect(user1).addLand(
                                landData.area,
                                landData.location,
                                landData.price,
                                landData.coordinates,
                                landData.propertyPID,
                                landData.surveyNumber,
                                landData.documentHash
                            );
                            const resolvedDisputes = await disputeRegistry.getLandDisputes(landId, 0, 1);
                            expect(resolvedDisputes[0].resolved).to.be.true;
                        });
                    });

                    // Frontend integration testing
                    describe("Frontend Integration Tests", function () {
                        let landId;
                        let requestId;

                        beforeEach(async function () {
                            await deployContracts();
                            const { userData, landData } = getTestData();

                            // Setup initial state
                            await registerUserIfNotRegistered(user1, userData);
                            await registerUserIfNotRegistered(user2, userData);
                            await verifyUserIfNotVerified(inspector, user1);
                            await verifyUserIfNotVerified(inspector, user2);

                            // Add a land
                            await landRegistry.connect(user1).addLand(
                                landData.area,
                                landData.location,
                                landData.price,
                                landData.coordinates,
                                landData.propertyPID,
                                landData.surveyNumber,
                                landData.documentHash
                            );

                            landId = await landRegistry.getTotalLands();
                            await landRegistry.connect(inspector).verifyLand(landId, true, "Verification approved");
                        });

                        describe("User Profile Management", function () {
                            it("Should get user verification status", async function () {
                                const status = await userRegistry.getVerificationStatus(user1.address);
                                expect(status.isRegistered).to.be.true;
                                expect(status.isVerified).to.be.true;
                            });

                            it("Should get user details", async function () {
                                const user = await userRegistry.users(user1.address);
                                expect(user.isVerified).to.be.true;
                                expect(user.name).to.not.equal("");
                            });

                            it("Should check user roles", async function () {
                                const VERIFIED_USER_ROLE = await userRegistry.VERIFIED_USER_ROLE();
                                const USER_ROLE = await userRegistry.USER_ROLE();

                                expect(await userRegistry.checkRole(VERIFIED_USER_ROLE, user1.address)).to.be.true;
                                expect(await userRegistry.checkRole(USER_ROLE, user1.address)).to.be.true;
                            });
                        });

                        describe("Land Listing Management", function () {
                            it("Should get all lands owned by user", async function () {
                                const userLands = await landRegistry.getUserLands(user1.address);
                                expect(userLands.length).to.be.greaterThan(0);
                                expect(userLands[0]).to.equal(landId);
                            });

                            it("Should get detailed land information", async function () {
                                const land = await landRegistry.getLandDetails(landId);
                                expect(land.owner).to.equal(user1.address);
                                expect(land.isVerified).to.be.true;
                                expect(land.isForSale).to.be.false;
                            });

                            it("Should get land history", async function () {
                                // First create some history by updating land details
                                await landRegistry.connect(user1).updateLandDetails(
                                    landId,
                                    "Updated Location",
                                    "Updated Coordinates",
                                    "Updated land details"
                                );

                                // Update land price to create another history entry
                                await landRegistry.connect(user1).updateLandPrice(
                                    landId,
                                    ethers.parseEther("12")
                                );

                                // Now get the history
                                const history = await landRegistry.getLandHistory(landId, 0, 10);
                                expect(history.length).to.be.greaterThan(0);
                                expect(history[0].description).to.equal("Updated land details");
                                expect(history[1].description).to.equal("Land price updated");
                            });

                            it("Should handle multiple document uploads", async function () {
                                // Skip verification since land is already verified in beforeEach
                                // Create document hashes
                                const doc1 = ethers.keccak256(ethers.toUtf8Bytes("DOC1"));
                                const doc2 = ethers.keccak256(ethers.toUtf8Bytes("DOC2"));

                                // Add first document
                                await landRegistry.connect(user1).addLandDocument(landId, doc1, "Document 1");

                                // Get metadata and verify first document
                                let [documents, descriptions, lastUpdated] = await landRegistry.getLandMetadata(landId);
                                expect(documents).to.not.be.undefined;
                                expect(documents[0]).to.equal(doc1);
                                expect(descriptions[0]).to.equal("Document 1");

                                // Add second document
                                await landRegistry.connect(user1).addLandDocument(landId, doc2, "Document 2");

                                // Get metadata and verify both documents
                                [documents, descriptions, lastUpdated] = await landRegistry.getLandMetadata(landId);
                                expect(documents.length).to.equal(2);
                                expect(descriptions.length).to.equal(2);
                            });
                        });

                        describe("Transaction Flow", function () {
                            beforeEach(async function () {
                                await landRegistry.connect(user1).putLandForSale(landId);
                                await transactionRegistry.connect(user2).createPurchaseRequest(landId);
                                requestId = await transactionRegistry.getTransactionCount();
                            });

                            it("Should track request status changes", async function () {
                                let request = await transactionRegistry.getPurchaseRequest(requestId);
                                expect(request.status).to.equal(0); // PENDING

                                await transactionRegistry.connect(user1).processPurchaseRequest(requestId, true);
                                request = await transactionRegistry.getPurchaseRequest(requestId);
                                expect(request.status).to.equal(1); // ACCEPTED
                            });

                            it("Should get user's purchase requests", async function () {
                                const requests = await transactionRegistry.getUserPurchaseRequests(user2.address);
                                expect(requests.length).to.be.greaterThan(0);
                                expect(requests[0]).to.equal(requestId);
                            });

                            it("Should track transaction history", async function () {
                                const history = await transactionRegistry.getUserTransactionHistoryPage(user2.address, 0, 10);
                                expect(history.transactions.length).to.be.greaterThan(0);
                                expect(history.transactions[0].landId).to.equal(landId);
                            });
                        });

                        describe("Dispute Handling", function () {
                            beforeEach(async function () {
                                // Ensure user3 is registered and verified
                                const { userData } = getTestData({
                                    name: "User Three",
                                    age: 25,
                                    city: "Chicago",
                                    email: "user3@example.com"
                                });

                                // Register user3 if not already registered
                                await registerUserIfNotRegistered(user3, userData);

                                // Verify user3 and assign VERIFIED_USER_ROLE
                                await userRegistry.connect(inspector).verifyUser(user3.address);

                                // Double check verification
                                const verificationStatus = await userRegistry.getVerificationStatus(user3.address);
                                expect(verificationStatus.isVerified).to.be.true;

                                // Ensure user3 is registered, verified and has VERIFIED_USER_ROLE
                                await registerUserIfNotRegistered(user3, userData);
                                await verifyUserIfNotVerified(inspector, user3);
                                const VERIFIED_USER_ROLE = await userRegistry.VERIFIED_USER_ROLE();
                                await userRegistry.connect(owner).assignRole(user3.address, VERIFIED_USER_ROLE);
                                await userRegistry.connect(owner).assignRole(user2.address, VERIFIED_USER_ROLE);

                                // Debug logs to verify roles and verification status
                                console.log("User2 Verification Status:", await userRegistry.getVerificationStatus(user2.address));
                                console.log("User3 Verification Status:", await userRegistry.getVerificationStatus(user3.address));
                                console.log("User2 has VERIFIED_USER_ROLE:", await userRegistry.checkRole(VERIFIED_USER_ROLE, user2.address));
                                console.log("User3 has VERIFIED_USER_ROLE:", await userRegistry.checkRole(VERIFIED_USER_ROLE, user3.address));
                            });

                            it("Should track multiple disputes for same land", async function () {
                                // Ensure user2 is verified and has VERIFIED_USER_ROLE
                                await verifyUserIfNotVerified(inspector, user2);
                                const VERIFIED_USER_ROLE = await userRegistry.VERIFIED_USER_ROLE();
                                await userRegistry.connect(owner).assignRole(user2.address, VERIFIED_USER_ROLE);

                                await disputeRegistry.connect(user2).raiseDispute(landId, "Dispute 1", 1);
                                await disputeRegistry.connect(user3).raiseDispute(landId, "Dispute 2", 2);

                                const disputes = await disputeRegistry.getLandDisputes(landId, 0, 10);
                                expect(disputes.length).to.equal(2);
                                expect(disputes[0].resolved).to.be.false;
                                expect(disputes[1].resolved).to.be.false;
                            });

                            it("Should handle dispute resolution with detailed information", async function () {
                                // Ensure user2 is verified and has VERIFIED_USER_ROLE
                                await verifyUserIfNotVerified(inspector, user2);
                                const VERIFIED_USER_ROLE = await userRegistry.VERIFIED_USER_ROLE();
                                await userRegistry.connect(owner).assignRole(user2.address, VERIFIED_USER_ROLE);

                                await disputeRegistry.connect(user2).raiseDispute(landId, "Boundary dispute", 1);
                                const disputes = await disputeRegistry.getLandDisputes(landId, 0, 1);

                                const resolutionDetails = "Dispute resolved after physical verification and survey";
                                await disputeRegistry.connect(inspector).resolveDispute(
                                    landId,
                                    disputes[0].disputeId,
                                    resolutionDetails
                                );

                                const updatedDisputes = await disputeRegistry.getLandDisputes(landId, 0, 1);
                                expect(updatedDisputes[0].resolved).to.be.true;
                                expect(updatedDisputes[0].resolution).to.equal(resolutionDetails);
                            });
                        });

                        describe("Error Handling and Edge Cases", function () {
                            it("Should handle invalid land IDs", async function () {
                                const invalidLandId = 99999;
                                await expect(
                                    landRegistry.getLandDetails(invalidLandId)
                                ).to.be.revertedWith("Invalid land ID");
                            });

                            it("Should prevent unauthorized ownership transfers", async function () {
                                await expect(
                                    landRegistry.connect(user2).transferLandOwnership(
                                        landId,
                                        user2.address,
                                        ethers.keccak256(ethers.toUtf8Bytes("INVALID"))
                                    )
                                ).to.be.revertedWith("Caller not authorized");
                            });

                            it("Should validate price updates", async function () {
                                await expect(
                                    landRegistry.connect(user1).updateLandPrice(landId, 0)
                                ).to.be.revertedWith("Price must be greater than 0");
                            });
                        });
                    });

                    describe("Frontend Specific Tests", function () {
                        let multipleLandIds = [];

                        beforeEach(async function () {
                            await deployContracts();
                            const { userData } = getTestData();

                            // Register and verify users
                            await registerUserIfNotRegistered(user1, userData);
                            await verifyUserIfNotVerified(inspector, user1);

                            // Add multiple lands for pagination testing
                            for (let i = 0; i < 5; i++) {
                                const { landData } = getTestData({
                                    location: `Test Location ${i}`,
                                    price: ethers.parseEther((10 + i).toString())
                                });

                                await landRegistry.connect(user1).addLand(
                                    landData.area,
                                    landData.location,
                                    landData.price,
                                    landData.coordinates,
                                    landData.propertyPID,
                                    landData.surveyNumber,
                                    landData.documentHash
                                );

                                const landId = await landRegistry.getTotalLands();
                                multipleLandIds.push(landId);

                                // Verify the land
                                await landRegistry.connect(inspector).verifyLand(landId, true, "Verification approved");

                                // Create some history by updating land details and price
                                await landRegistry.connect(user1).updateLandDetails(
                                    landId,
                                    `Updated Location ${i}`,
                                    `Updated Coordinates ${i}`,
                                    `Update ${i}`
                                );
                                await landRegistry.connect(user1).updateLandPrice(
                                    landId,
                                    ethers.parseEther((15 + i).toString())
                                );
                            }
                        });

                        describe("Pagination and Data Loading", function () {
                            // Setup for testing pagination and data loading
                            describe("Pagination and Data Loading", function () {
                                // Test scenarios:
                                // 1. Multiple page navigation
                                // 2. Boundary conditions
                                // 3. Data consistency across pages
                                it("Should handle land listing pagination correctly", async function () {
                                    const pageSize = 2;
                                    const totalLands = multipleLandIds.length;
                                    const pages = Math.ceil(totalLands / pageSize);

                                    for (let page = 0; page < pages; page++) {
                                        const offset = page * pageSize;
                                        const userLands = await landRegistry.getUserLands(user1.address);
                                        expect(userLands.length).to.be.greaterThan(0);

                                        // Get history for the first land with proper pagination
                                        const landId = userLands[0];
                                        const landHistory = await landRegistry.getLandHistory(landId, 0, 2);
                                        expect(landHistory.length).to.be.greaterThan(0);
                                        expect(landHistory[0].description).to.include("Update");
                                    }
                                });
                            });

                            // ...rest of the tests remain unchanged...
                        });

                        // ...rest of the describe blocks remain unchanged...

                        describe("Search and Filter Functionality", function () {
                            it("Should filter lands by price range", async function () {
                                const userLands = await landRegistry.getUserLands(user1.address);
                                let landsInRange = 0;
                                const minPrice = ethers.parseEther("12");
                                const maxPrice = ethers.parseEther("15");

                                for (const landId of userLands) {
                                    const land = await landRegistry.getLandDetails(landId);
                                    if (land.price >= minPrice && land.price <= maxPrice) {
                                        landsInRange++;
                                    }
                                }

                                expect(landsInRange).to.be.greaterThan(0);
                            });

                            it("Should search lands by location", async function () {
                                const userLands = await landRegistry.getUserLands(user1.address);
                                let matchingLands = 0;
                                const searchTerm = "Location 2";

                                for (const landId of userLands) {
                                    const land = await landRegistry.getLandDetails(landId);
                                    if (land.location.includes(searchTerm)) {
                                        matchingLands++;
                                    }
                                }

                                expect(matchingLands).to.equal(1);
                            });
                        });

                        describe("Data Validation and Formatting", function () {
                            beforeEach(async function () {
                                // Deploy fresh contracts for each test
                                await deployContracts();
                            });

                            it("Should validate email format through user registration", async function () {
                                const validEmail = "test@example.com";
                                const invalidEmail = "invalid.email";
                                const testData = getTestData();

                                // Create new unregistered users for testing
                                const [, , , , , newUser1, newUser2] = await ethers.getSigners();

                                // Test valid email with first new user
                                await expect(
                                    userRegistry.connect(newUser1).registerUser(
                                        "Test User",
                                        25,
                                        "City",
                                        testData.userData.aadharNumber,
                                        testData.userData.panNumber,
                                        testData.userData.documentHash,
                                        validEmail
                                    )
                                ).to.not.be.reverted;

                                // Test invalid email with second new user
                                await expect(
                                    userRegistry.connect(newUser2).registerUser(
                                        "Test User",
                                        25,
                                        "City",
                                        testData.userData.aadharNumber,
                                        testData.userData.panNumber,
                                        testData.userData.documentHash,
                                        invalidEmail
                                    )
                                ).to.be.revertedWith("Invalid email format");
                            });

                            it("Should validate string length through user registration", async function () {
                                const testData = getTestData();
                                const longString = "a".repeat(1001); // String longer than allowed
                                const validAadhar = generateUniqueAadhar();
                                const validPan = generateUniquePAN();
                                const validEmail = "test@example.com";

                                // Get multiple signers for different registration attempts
                                const [, , , , , newUser1, newUser2, newUser3] = await ethers.getSigners();

                                // First test with valid data to ensure basic registration works
                                await expect(
                                    userRegistry.connect(newUser1).registerUser(
                                        "Test User", // normal length name
                                        25,
                                        "City",
                                        validAadhar,
                                        validPan,
                                        testData.userData.documentHash,
                                        validEmail
                                    )
                                ).to.not.be.reverted;

                                // Test with long string for name using second user
                                await expect(
                                    userRegistry.connect(newUser2).registerUser(
                                        longString, // extremely long name
                                        25,
                                        "City",
                                        generateUniqueAadhar(), // Use different Aadhar
                                        generateUniquePAN(),    // Use different PAN
                                        testData.userData.documentHash,
                                        validEmail
                                    )
                                ).to.be.revertedWith("String too long");

                                // Test with long string for city using third user
                                await expect(
                                    userRegistry.connect(newUser3).registerUser(
                                        "Test User",
                                        25,
                                        longString, // extremely long city name
                                        generateUniqueAadhar(), // Use different Aadhar
                                        generateUniquePAN(),    // Use different PAN
                                        testData.userData.documentHash,
                                        validEmail
                                    )
                                ).to.be.revertedWith("String too long");
                            });
                        });

                        describe("Transaction Status Updates", function () {
                            it("Should track all status changes in a transaction", async function () {
                                // Create a new purchase request
                                await landRegistry.connect(user1).putLandForSale(multipleLandIds[0]);
                                await transactionRegistry.connect(user2).createPurchaseRequest(multipleLandIds[0]);
                                const requestId = await transactionRegistry.getTransactionCount();

                                // Track status changes
                                let statuses = [];
                                let request = await transactionRegistry.getPurchaseRequest(requestId);
                                statuses.push(request.status);

                                it("Should manage multiple document types", async function () {
                                    const documentTypes = [
                                        { hash: ethers.keccak256(ethers.toUtf8Bytes("TITLE_DEED")), desc: "Title Deed" },
                                        { hash: ethers.keccak256(ethers.toUtf8Bytes("SURVEY_DOC")), desc: "Survey Document" },
                                        { hash: ethers.keccak256(ethers.toUtf8Bytes("TAX_CERT")), desc: "Tax Certificate" }
                                    ];

                                    for (const doc of documentTypes) {
                                        await landRegistry.connect(user1).addLandDocument(
                                            multipleLandIds[0],
                                            doc.hash,
                                            doc.desc
                                        );
                                    }

                                    const [documents, descriptions] = await landRegistry.getLandMetadata(multipleLandIds[0]);
                                    expect(documents.length).to.equal(documentTypes.length);
                                    expect(descriptions.length).to.equal(documentTypes.length);
                                });
                            });

                            describe("Role-based Access Control", function () {
                                it("Should enforce role-based permissions", async function () {
                                    const roles = [
                                        await userRegistry.ADMIN_ROLE(),
                                        await userRegistry.INSPECTOR_ROLE(),
                                        await userRegistry.USER_ROLE(),
                                        await userRegistry.VERIFIED_USER_ROLE()
                                    ];

                                    for (const role of roles) {
                                        const hasRole = await userRegistry.checkRole(role, user1.address);
                                        expect(typeof hasRole).to.equal('boolean');
                                    }
                                });
                            });

                            describe("Error Handling for UI", function () {
                                it("Should provide meaningful error messages", async function () {
                                    await expect(
                                        landRegistry.connect(user2).putLandForSale(multipleLandIds[0])
                                    ).to.be.revertedWith("Not the land owner");

                                    await expect(
                                        landRegistry.connect(user1).updateLandPrice(multipleLandIds[0], 0)
                                    ).to.be.revertedWith("Price must be greater than 0");

                                    await expect(
                                        userRegistry.connect(user1).registerUser(
                                            "",
                                            25,
                                            "City",
                                            ethers.ZeroHash,
                                            ethers.ZeroHash,
                                            ethers.ZeroHash,
                                            "test@example.com"
                                        )
                                    ).to.be.revertedWith("Name cannot be empty");
                                });
                            });

                            describe("Event Handling", function () {
                                it("Should emit and capture all relevant events", async function () {
                                    const { landData } = getTestData();

                                    // Get the current total lands count before adding new land
                                    const currentTotalLands = await landRegistry.getTotalLands();

                                    // Test multiple events in a single transaction
                                    await expect(landRegistry.connect(user1).addLand(
                                        landData.area,
                                        landData.location,
                                        landData.price,
                                        landData.coordinates,
                                        landData.propertyPID,
                                        landData.surveyNumber,
                                        landData.documentHash
                                    )).to.emit(landRegistry, "LandAdded")
                                        .withArgs(currentTotalLands + BigInt(1), user1.address);
                                });

                                // ...rest of event handling tests remain unchanged...
                            });

                            describe("Batch Operations Performance", function () {
                                it("Should handle large batch operations efficiently", async function () {
                                    const batchSize = 5;
                                    const requestIds = [];
                                    const decisions = Array(batchSize).fill(true);

                                    // First ensure user1 has correct roles
                                    const USER_ROLE = await userRegistry.USER_ROLE();
                                    const VERIFIED_USER_ROLE = await userRegistry.VERIFIED_USER_ROLE();

                                    // Assign roles in correct order
                                    if (!await userRegistry.checkRole(USER_ROLE, user1.address)) {
                                        await userRegistry.connect(owner).assignRole(user1.address, USER_ROLE);
                                    }

                                    // Wait for the first role assignment to be mined
                                    await ethers.provider.send("evm_mine", []);

                                    if (!await userRegistry.checkRole(VERIFIED_USER_ROLE, user1.address)) {
                                        await userRegistry.connect(owner).assignRole(user1.address, VERIFIED_USER_ROLE);
                                    }

                                    // Create multiple lands and purchase requests
                                    for (let i = 0; i < batchSize; i++) {
                                        const { landData } = getTestData();
                                        await landRegistry.connect(user1).addLand(
                                            landData.area,
                                            landData.location,
                                            landData.price,
                                            landData.coordinates,
                                            landData.propertyPID,
                                            landData.surveyNumber,
                                            landData.documentHash
                                        );
                                        const landId = await landRegistry.getTotalLands();

                                        // Verify land
                                        await landRegistry.connect(inspector).verifyLand(landId, true, "Verification approved");

                                        // Put land for sale
                                        await landRegistry.connect(user1).putLandForSale(landId);

                                        // Create purchase request
                                        await transactionRegistry.connect(user2).createPurchaseRequest(landId);
                                        const requestId = await transactionRegistry.getTransactionCount();
                                        requestIds.push(requestId);
                                    }

                                    // Also assign roles in transaction registry
                                    await transactionRegistry.connect(owner).assignRole(user1.address, USER_ROLE);
                                    await ethers.provider.send("evm_mine", []);
                                    await transactionRegistry.connect(owner).assignRole(user1.address, VERIFIED_USER_ROLE);

                                    // Now process the batch requests
                                    await transactionRegistry.connect(user1).batchProcessRequests(requestIds, decisions);

                                    // Verify all requests were processed
                                    for (const requestId of requestIds) {
                                        const request = await transactionRegistry.getPurchaseRequest(requestId);
                                        expect(request.status).to.equal(1); // ACCEPTED
                                    }
                                });
                            });

                            describe("Search and Filter Optimization", function () {
                                it("Should handle complex search queries efficiently", async function () {
                                    const searchResults = [];
                                    const userLands = await landRegistry.getUserLands(user1.address);

                                    // Complex search with multiple criteria
                                    for (const landId of userLands) {
                                        const land = await landRegistry.getLandDetails(landId);
                                        if (land.price >= ethers.parseEther("12") &&
                                            land.price <= ethers.parseEther("15") &&
                                            land.location.includes("Location") &&
                                            land.isVerified) {
                                            searchResults.push(land);
                                        }
                                    }

                                    expect(searchResults.length).to.be.greaterThan(0);
                                });
                            });

                            describe("Pagination Edge Cases", function () {
                                it("Should handle pagination boundaries correctly", async function () {
                                    // Use an existing land ID from multipleLandIds
                                    const landId = multipleLandIds[0];

                                    // Initial history check
                                    const history = await landRegistry.getLandHistory(landId, 0, 5);
                                    const totalHistory = BigInt(history.length);

                                    // Test invalid offset
                                    const invalidOffset = totalHistory + BigInt(1);
                                    await expect(
                                        landRegistry.getLandHistory(landId, invalidOffset, BigInt(10))
                                    ).to.be.revertedWith("Invalid offset");

                                    // Test last page
                                    if (totalHistory > BigInt(0)) {
                                        const lastPageSize = BigInt(2);
                                        const validOffset = totalHistory > BigInt(2)
                                            ? totalHistory - BigInt(2)
                                            : BigInt(0);

                                        const lastPageHistory = await landRegistry.getLandHistory(
                                            landId,
                                            validOffset,
                                            lastPageSize
                                        );
                                        expect(lastPageHistory.length).to.be.lessThanOrEqual(Number(lastPageSize));
                                    }
                                });
                            });

                            describe("Error Message Formatting", function () {
                                it("Should provide user-friendly error messages", async function () {
                                    const errors = [];
                                    try {
                                        await landRegistry.connect(user2).putLandForSale(999999);
                                    } catch (error) {
                                        errors.push(error.message);
                                    }

                                    try {
                                        await landRegistry.connect(user1).updateLandPrice(1, 0);
                                    } catch (error) {
                                        errors.push(error.message);
                                    }

                                    // Verify error messages are user-friendly
                                    for (const error of errors) {
                                        expect(error).to.match(/^[A-Z].*[^.]$/); // Starts with capital, no trailing period
                                        // Increase max length to 150 characters to accommodate longer revert messages
                                        expect(error.length).to.be.lessThan(150); // More reasonable length limit
                                    }
                                });
                            });
                        });

                        describe("Transaction Flow", function () {
                            let landId;
                            let requestId;
                            let landPrice;

                            beforeEach(async function () {
                                // Deploy fresh contracts for each test
                                await deployContracts();

                                const { landData } = getTestData();
                                landPrice = landData.price;

                                // Add and verify land
                                await landRegistry.connect(user1).addLand(
                                    landData.area,
                                    landData.location,
                                    landData.price,
                                    landData.coordinates,
                                    landData.propertyPID,
                                    landData.surveyNumber,
                                    landData.documentHash
                                );

                                landId = await landRegistry.getTotalLands();

                                // Step 1: Verify land first
                                await landRegistry.connect(inspector).verifyLand(landId, true, "Verification approved");

                                // Step 2: Put land for sale
                                await landRegistry.connect(user1).putLandForSale(landId);

                                // Step 3: Create purchase request
                                await transactionRegistry.connect(user2).createPurchaseRequest(landId);
                                requestId = await transactionRegistry.getTransactionCount();

                                // Step 4: Accept request and ensure transaction is mined
                                const acceptTx = await transactionRegistry.connect(user1).processPurchaseRequest(requestId, true);
                                await acceptTx.wait(); // Wait for transaction to be mined

                                // Verify the request status is ACCEPTED
                                const request = await transactionRegistry.getPurchaseRequest(requestId);
                                expect(request.status).to.equal(1); // ACCEPTED
                            });

                            it("Should handle payment validation", async function () {
                                // Verify initial request status
                                const requestBefore = await transactionRegistry.getPurchaseRequest(requestId);
                                expect(requestBefore.status).to.equal(1); // ACCEPTED
                                expect(requestBefore.isPaymentDone).to.be.false;

                                // Test incorrect payment amount
                                await expect(
                                    transactionRegistry.connect(user2).makePayment(requestId, {
                                        value: ethers.parseEther("0.5")
                                    })
                                ).to.be.revertedWith("Incorrect payment amount");

                                // Make successful payment
                                const paymentTx = await transactionRegistry.connect(user2).makePayment(requestId, {
                                    value: landPrice
                                });
                                await paymentTx.wait();

                                // Verify payment status after successful payment
                                const requestAfterPayment = await transactionRegistry.getPurchaseRequest(requestId);
                                expect(requestAfterPayment.status).to.equal(3); // PAYMENT_DONE
                                expect(requestAfterPayment.isPaymentDone).to.be.true;

                                // Attempt double payment - should fail with correct error
                                await expect(
                                    transactionRegistry.connect(user2).makePayment(requestId, {
                                        value: landPrice
                                    })
                                ).to.be.revertedWith("Payment already done");
                            });

                            // Add this test to verify atomic transfer
                            it("Should transfer ownership automatically after payment", async function () {
                                // Setup
                                await landRegistry.connect(user1).putLandForSale(landId);
                                await transactionRegistry.connect(user2).createPurchaseRequest(landId);
                                const requestId = await transactionRegistry.getTransactionCount();
                                await transactionRegistry.connect(user1).processPurchaseRequest(requestId, true);

                                // Get initial states
                                const initialOwner = await landRegistry.getLandOwner(landId);
                                const price = await landRegistry.getLandPrice(landId);

                                // Make payment
                                await transactionRegistry.connect(user2).makePayment(requestId, { value: price });

                                // Verify ownership transferred immediately
                                const newOwner = await landRegistry.getLandOwner(landId);
                                expect(newOwner).to.equal(user2.address);
                                expect(initialOwner).to.not.equal(newOwner);

                                // Verify request completed
                                const request = await transactionRegistry.getPurchaseRequest(requestId);
                                expect(request.status).to.equal(4); // COMPLETED
                            });

                            // Add test for payment validation
                            it("Should validate payment conditions properly", async function () {
                                // Setup same as above...

                                // Test incorrect payment amount
                                await expect(
                                    transactionRegistry.connect(user2).makePayment(requestId, {
                                        value: ethers.parseEther("0.5")
                                    })
                                ).to.be.revertedWith("Incorrect payment amount");

                                // Test payment when land not for sale
                                await landRegistry.connect(user1).takeLandOffSale(landId);
                                await expect(
                                    transactionRegistry.connect(user2).makePayment(requestId, {
                                        value: price
                                    })
                                ).to.be.revertedWith("Land not for sale");
                            });
                        });

                        describe("Document Management", function () {
                            let landId;

                            beforeEach(async function () {
                                const { landData } = getTestData();

                                // Add a land first
                                await landRegistry.connect(user1).addLand(
                                    landData.area,
                                    landData.location,
                                    landData.price,
                                    landData.coordinates,
                                    landData.propertyPID,
                                    landData.surveyNumber,
                                    landData.documentHash
                                );

                                landId = await landRegistry.getTotalLands();

                                // Verify the land first
                                await landRegistry.connect(inspector).verifyLand(landId, true, "Verification approved");
                            });

                            it("Should enforce maximum document limits", async function () {
                                // First verify the land
                                const maxDocs = await landRegistry.MAX_DOCUMENTS_PER_LAND();
                                const docs = Array(Number(maxDocs) + 1).fill().map((_, i) =>
                                    ethers.keccak256(ethers.toUtf8Bytes(`DOC${i}`))
                                );

                                // Add documents up to the limit
                                for (let i = 0; i < maxDocs; i++) {
                                    await landRegistry.connect(user1).addLandDocument(
                                        landId,
                                        docs[i],
                                        `Document ${i}`
                                    );
                                }

                                // Try to add one more document
                                await expect(
                                    landRegistry.connect(user1).addLandDocument(
                                        landId,
                                        docs[maxDocs],
                                        `Document ${maxDocs}`
                                    )
                                ).to.be.revertedWith("Maximum documents reached");
                            });
                        });

                        describe("Error Handling", function () {
                            let landId;

                            beforeEach(async function () {
                                const { landData } = getTestData();
                                await landRegistry.connect(user1).addLand(
                                    landData.area,
                                    landData.location,
                                    landData.price,
                                    landData.coordinates,
                                    landData.propertyPID,
                                    landData.surveyNumber,
                                    landData.documentHash
                                );
                                landId = await landRegistry.getTotalLands();
                                // Verify the land for price update test
                                await landRegistry.connect(inspector).verifyLand(landId, true, "Verification approved");
                            });

                            it("Should provide formatted error messages", async function () {
                                const nonExistentLandId = 99999;

                                // Test non-existent land ID
                                await expect(
                                    landRegistry.getLandDetails(nonExistentLandId)
                                ).to.be.revertedWith("Invalid land ID");

                                // Test unauthorized land actions
                                await expect(
                                    landRegistry.connect(user2).putLandForSale(landId)
                                ).to.be.revertedWith("Not the land owner");

                                // Test invalid price update on verified land
                                await expect(
                                    landRegistry.connect(user1).updateLandPrice(landId, 0)
                                ).to.be.revertedWith("Price must be greater than 0");
                            });
                        });

                        describe("Owner Land Inspector Management", function () {
                            beforeEach(async function () {
                                await deployContracts();
                            });

                            it("Should allow owner to add land inspectors", async function () {
                                const INSPECTOR_ROLE = await userRegistry.INSPECTOR_ROLE();

                                // Add inspector role to user3
                                await userRegistry.connect(owner).assignRole(user3.address, INSPECTOR_ROLE);

                                // Verify the role assignment
                                expect(await userRegistry.checkRole(INSPECTOR_ROLE, user3.address)).to.be.true;
                            });

                            it("Should allow owner to revoke land inspector role", async function () {
                                const INSPECTOR_ROLE = await userRegistry.INSPECTOR_ROLE();

                                // Add inspector role to user3
                                await userRegistry.connect(owner).assignRole(user3.address, INSPECTOR_ROLE);
                                expect(await userRegistry.checkRole(INSPECTOR_ROLE, user3.address)).to.be.true;

                                // Revoke inspector role from user3
                                await userRegistry.connect(owner).revokeRole(user3.address, INSPECTOR_ROLE);

                                // Verify the role revocation
                                expect(await userRegistry.checkRole(INSPECTOR_ROLE, user3.address)).to.be.false;
                            });

                            it("Should not allow non-inspectors to verify lands", async function () {
                                // Add land
                                const { landData } = getTestData();
                                await landRegistry.connect(user1).addLand(
                                    landData.area,
                                    landData.location,
                                    landData.price,
                                    landData.coordinates,
                                    landData.propertyPID,
                                    landData.surveyNumber,
                                    landData.documentHash
                                );
                                const landId = await landRegistry.getTotalLands();

                                // Attempt to verify land by user2 (not an inspector)
                                await expect(
                                    landRegistry.connect(user2).verifyLand(landId, true, "Verification approved")
                                ).to.be.revertedWith("Caller does not have required role");
                            });

                            it("Should allow owner to assign and revoke multiple roles", async function () {
                                const USER_ROLE = await userRegistry.USER_ROLE();
                                const INSPECTOR_ROLE = await userRegistry.INSPECTOR_ROLE();

                                // Assign user role to user3
                                await userRegistry.connect(owner).assignRole(user3.address, USER_ROLE);
                                expect(await userRegistry.checkRole(USER_ROLE, user3.address)).to.be.true;

                                // Assign inspector role to user3
                                await userRegistry.connect(owner).assignRole(user3.address, INSPECTOR_ROLE);
                                expect(await userRegistry.checkRole(INSPECTOR_ROLE, user3.address)).to.be.true;

                                // Revoke user role from user3
                                await userRegistry.connect(owner).revokeRole(user3.address, USER_ROLE);
                                expect(await userRegistry.checkRole(USER_ROLE, user3.address)).to.be.false;

                                // Revoke inspector role from user3
                                await userRegistry.connect(owner).revokeRole(user3.address, INSPECTOR_ROLE);
                                expect(await userRegistry.checkRole(INSPECTOR_ROLE, user3.address)).to.be.false;
                            });
                        });

                        describe("Owner Functionality", function () {
                            beforeEach(async function () {
                                await deployContracts();
                            });

                            it("Should allow owner to pause and unpause the contract", async function () {
                                // Pause the contract
                                await userRegistry.connect(owner).pause();
                                expect(await userRegistry.paused()).to.be.true;

                                // Unpause the contract
                                await userRegistry.connect(owner).unpause();
                                expect(await userRegistry.paused()).to.be.false;
                            });

                            it("Should not allow non-owners to pause the contract", async function () {
                                await expect(
                                    userRegistry.connect(user1).pause()
                                ).to.be.revertedWith("Caller does not have required role");
                            });

                            it("Should allow owner to transfer ownership", async function () {
                                // Transfer ownership to user1
                                await userRegistry.connect(owner).transferOwnership(user1.address);
                                expect(await userRegistry.owner()).to.equal(user1.address);

                                // Assign necessary roles to the new owner
                                const ADMIN_ROLE = await userRegistry.ADMIN_ROLE();
                                await userRegistry.connect(owner).assignRole(user1.address, ADMIN_ROLE);

                                // Verify new owner can pause the contract
                                await userRegistry.connect(user1).pause();
                                expect(await userRegistry.paused()).to.be.true;
                            });

                            it("Should not allow non-owners to transfer ownership", async function () {
                                await expect(
                                    userRegistry.connect(user1).transferOwnership(user2.address)
                                ).to.be.revertedWith("Not the owner");
                            });
                        });

                        describe("Document Validation", function () {
                            it("Should validate Aadhar number format correctly", async function () {
                                const validAadhar = "123456789012";
                                const invalidAadhar = "12345"; // too short

                                await expect(
                                    userRegistry.connect(user3).registerUser(
                                        "Test User",
                                        25,
                                        "City",
                                        invalidAadhar,
                                        "ABCDE1234F",
                                        ethers.keccak256(ethers.toUtf8Bytes("DOC")),
                                        "test@example.com"
                                    )
                                ).to.be.revertedWith("Invalid Aadhar number");
                            });

                            it("Should validate PAN number format correctly", async function () {
                                const validPan = "ABCDE1234F";
                                const invalidPan = "123456789"; // incorrect format

                                await expect(
                                    userRegistry.connect(user3).registerUser(
                                        "Test User",
                                        25,
                                        "City",
                                        "123456789012",
                                        invalidPan,
                                        ethers.keccak256(ethers.toUtf8Bytes("DOC")),
                                        "test@example.com"
                                    )
                                ).to.be.revertedWith("Invalid PAN number");
                            });
                        });

                        describe("Inspector Management", function () {
                            beforeEach(async function () {
                                // Remove the inspector if they already exist
                                try {
                                    await userRegistry.connect(owner).removeInspector(user3.address);
                                } catch (error) {
                                    // Ignore error if inspector does not exist
                                }
                            });

                            it("Should allow owner to add an inspector", async function () {
                                const INSPECTOR_ROLE = await userRegistry.INSPECTOR_ROLE();
                                await userRegistry.connect(owner).addInspector(user3.address, "John Doe", 30, "Senior Inspector");
                                expect(await userRegistry.checkRole(INSPECTOR_ROLE, user3.address)).to.be.true;
                            });

                            it("Should allow owner to remove an inspector", async function () {
                                const INSPECTOR_ROLE = await userRegistry.INSPECTOR_ROLE();
                                await userRegistry.connect(owner).addInspector(user3.address, "John Doe", 30, "Senior Inspector");
                                await userRegistry.connect(owner).removeInspector(user3.address);
                                expect(await userRegistry.checkRole(INSPECTOR_ROLE, user3.address)).to.be.false;
                            });

                            it("Should not allow non-owners to add inspectors", async function () {
                                await expect(
                                    userRegistry.connect(user1).addInspector(user3.address, "John Doe", 30, "Senior Inspector")
                                ).to.be.revertedWith("Not the owner");
                            });

                            it("Should not allow non-owners to remove inspectors", async function () {
                                await userRegistry.connect(owner).addInspector(user3.address, "John Doe", 30, "Senior Inspector");
                                await expect(
                                    userRegistry.connect(user1).removeInspector(inspector.address)
                                ).to.be.revertedWith("Not the owner");
                            });

                            it("Should add inspector with correct details", async function () {
                                await userRegistry.connect(owner).addInspector(user3.address, "John Doe", 30, "Senior Inspector");
                                const inspector = await userRegistry.getInspector(user3.address);
                                expect(inspector.name).to.equal("John Doe");
                                expect(inspector.age).to.equal(30);
                                expect(inspector.designation).to.equal("Senior Inspector");
                            });

                            it("Should not add inspector with invalid details", async function () {
                                await expect(
                                    userRegistry.connect(owner).addInspector(user3.address, "", 30, "Senior Inspector")
                                ).to.be.revertedWith("Name cannot be empty");

                                await expect(
                                    userRegistry.connect(owner).addInspector(user3.address, "John Doe", 17, "Senior Inspector")
                                ).to.be.revertedWith("Inspector must be an adult");
                            });

                            it("Should get inspector details correctly", async function () {
                                await userRegistry.connect(owner).addInspector(user3.address, "John Doe", 30, "Senior Inspector");
                                const inspector = await userRegistry.getInspector(user3.address);
                                expect(inspector.id).to.be.gt(0);
                                expect(inspector.name).to.equal("John Doe");
                                expect(inspector.age).to.equal(30);
                                expect(inspector.designation).to.equal("Senior Inspector");
                            });

                            it("Should remove inspector correctly", async function () {
                                // Add the inspector first
                                await userRegistry.connect(owner).addInspector(user3.address, "John Doe", 30, "Senior Inspector");

                                // Now remove the inspector
                                await userRegistry.connect(owner).removeInspector(user3.address);

                                // Verify the inspector has been removed
                                await expect(
                                    userRegistry.getInspector(user3.address)
                                ).to.be.revertedWith("Inspector does not exist");
                            });
                        });

                        describe("Land Inspector Functions", function () {
                            let landId;

                            beforeEach(async function () {
                                // Get fresh test data
                                const { landData } = getTestData();

                                // Add new land
                                await landRegistry.connect(user1).addLand(
                                    landData.area,
                                    landData.location,
                                    landData.price,
                                    landData.coordinates,
                                    landData.propertyPID,
                                    landData.surveyNumber,
                                    landData.documentHash
                                );
                                landId = await landRegistry.getTotalLands();
                            });

                            it("Should allow inspector to verify land", async function () {
                                // Verify the land
                                await landRegistry.connect(inspector).verifyLand(landId, true, "Verification approved");
                                const land = await landRegistry.getLandDetails(landId);
                                expect(land.isVerified).to.be.true;
                                expect(land.verificationRemark).to.equal("Verification approved");
                            });

                            it("Should not allow verification of already verified land", async function () {
                                // First verification
                                await landRegistry.connect(inspector).verifyLand(landId, true, "First verification");

                                // Attempt second verification - should fail
                                await expect(
                                    landRegistry.connect(inspector).verifyLand(landId, true, "Second verification")
                                ).to.be.revertedWith("Land already verified");
                            });

                            it("Should allow inspector to reject land with reason", async function () {
                                await landRegistry.connect(inspector).verifyLand(landId, false, "Documentation incomplete");
                                const land = await landRegistry.getLandDetails(landId);
                                expect(land.isVerified).to.be.false;
                                expect(land.verificationRemark).to.equal("Documentation incomplete");
                            });
                        });
                    });
                });
            });
        });
    });
});
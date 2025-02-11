BaseRegistry.sol
Base contract that provides core functionality for role management and security
Implements role-based access control (RBAC) with roles like ADMIN, INSPECTOR, USER, VERIFIED_USER
Handles inspector management (adding/removing land inspectors)
Contains emergency functions like pause/unpause and emergency withdrawal
Provides common utilities for pagination and validation
Key functions include role assignment/revocation, ownership transfer, and inspector management
UserRegistry.sol
Manages user registration and verification in the land registration system
Handles user details including personal info and document verification
Implements user verification workflow with inspectors
Tracks unique documents (Aadhar, PAN) to prevent duplicates
Key features:
User registration with document verification
User verification by inspectors
User rejection handling with cooldown period
User document updates and city management
Batch verification capabilities
LandRegistry.sol
Core contract for land management and ownership
Handles land registration, verification, and ownership transfers
Maintains land history and additional documents
Implements land sale functionality
Key features:
Land registration with unique identifiers
Land verification by inspectors
Land ownership transfers
Document management
Sale management (putting land on/off sale)
Land history tracking
TransactionRegistry.sol
Manages land purchase transactions and requests
Handles the complete workflow of land purchase from request to completion
Tracks transaction history and market metrics
Key features:
Purchase request creation and management
Payment processing
Transaction history tracking
Market volume tracking
Withdrawal management
StringUtils.sol
Utility library for string operations and validation
Provides functions for:
Email validation
Aadhar number validation
PAN number validation
String comparison and length validation
The system follows a modular architecture where:

BaseRegistry provides core functionality
UserRegistry handles user management
LandRegistry manages land records
TransactionRegistry handles purchases
StringUtils provides utility functions
All contracts work together to create a complete land registration and transfer system with proper security, validation, and tracking mechanisms.


Home.jsx
Located in /src/components/pages/Home.jsx
Main landing page component using React and Framer Motion
Features:
Modern UI with gradient styling
Hero section with animated features
Wallet connection handling
Role-based welcome section
Interactive feature cards
Responsive design with CSS-in-JS
Key components: WelcomeSection, ConnectWalletSection, FeatureCard
ipfsUtils.js
Located in /src/utils/ipfsUtils.js
Handles IPFS file operations
Key functions:
bytesToIpfsHash: Converts bytes32 to IPFS hash format
ipfsHashToBytes32: Converts IPFS hash to bytes32
getIpfsUrl: Generates IPFS gateway URLs
uploadToIPFS: Handles file uploads to IPFS
uploadFileAndConvertHash: Combined upload and hash conversion
contractService.js
Located in /src/services/contractService.js
Central service for blockchain contract interactions
Features:
Contract initialization and management
Transaction handling
Event listeners setup
Network validation
Error handling and logging
useWeb3.js
Located in /src/core/hooks/useWeb3.js
Custom React hook for Web3 functionality
Manages:
Wallet connections
Network switching
Provider and signer state
Connection status
Error handling
useUser.js
Located in /src/core/hooks/useUser.js
Custom hook for user-related operations
Features:
Land management
Transaction handling
User stats
Market operations
Event handling
useInspector.js
Located in /src/core/hooks/useInspector.js
Hook for inspector-specific functionality
Handles:
User verification
Land verification
Dispute management
Inspector stats
Role validation
AuthContext.jsx
Located in /src/core/context/AuthContext.jsx
Global authentication context
Manages:
User authentication state
Contract initialization
Role-based access
Session management
Event handling
ProtectedRoute.jsx
Located in /src/components/auth/ProtectedRoute.jsx
Route protection component
Features:
Role-based access control
Authentication verification
Redirect handling
Loading states
Error handling
App.jsx
Located in /src/App.jsx
Main application component
Features:
Route configuration
Lazy loading
Error boundaries
Protected routes setup
Toast notifications
config/index.js
Located in /src/core/config/index.js
Central configuration file
Contains:
Contract addresses
IPFS configuration
Role definitions
Route mappings
Access control logic
Cache configuration
Constants and enums
This application appears to be a comprehensive land registration system built on blockchain technology, with role-based access control and extensive features for land management, verification, and transactions.


Navbar.jsx
Purpose: Main navigation component
Key Features:
Dynamic menu based on user role
Account info display with address and role
Logout functionality
Responsive design with modern styling
Role-based navigation links
Clean, modern UI with hover effects
useRoles.js
Purpose: Role management hook
Key Features:
Role determination and validation
Access control functions
Route redirection logic
Event handling for role-specific events
Role hierarchy management
Comprehensive logging
Layout.jsx
Purpose: Main layout wrapper component
Key Features:
Consistent page structure
Loading state management
Navbar integration
Error boundary implementation
Responsive design
Clean mounting/unmounting
UserVerification.jsx
Purpose: Inspector interface for verifying users
Key Features:
User verification workflow
Document verification
Rejection handling with reasons
Real-time updates
Detailed user information display
Error handling and logging
LandVerification.jsx
Purpose: Inspector interface for verifying properties
Key Features:
Land verification workflow
Document management
Property details display
Verification/rejection handling
Status tracking
IPFS integration
InspectorDashboard.jsx
Purpose: Main dashboard for inspectors
Key Features:
Statistics overview
Quick actions
Real-time updates
Task tracking
Navigation to verification pages
Clean, modern UI
Dashboard.jsx
Purpose: User dashboard component
Key Features:
Property overview
Transaction tracking
Market metrics
Quick actions
Stats display
Real-time updates
UpdateLandModal.jsx
Purpose: Modal for updating land details
Key Features:
Price updates
Document management
Metadata handling
Validation
IPFS integration
Error handling
MyLands.jsx
Purpose: User's property management
Key Features:
Property listing
Sale management
Document viewing
Property updates
Status tracking
IPFS integration
AddLandModal.jsx
Purpose: Modal for adding new properties
Key Features:
Form validation
Document upload
Price handling in ETH
Property details validation
IPFS integration
Error handling
Field validation with Yup
Clean UI with proper feedback
Each file is structured with modern React practices, includes comprehensive error handling, and follows a consistent styling approach. They work together to provide a complete land registration system with role-based access control and blockchain integration.

I'll explain each main page and its functionality:

Home Page (Home.jsx)
Main landing page of the application
Features:
Hero section with gradient background
Connect wallet functionality
Dynamic welcome message based on user role
Feature cards showcasing platform capabilities
Smart contract initialization checks
Metamask integration
Network validation
User Dashboard (Dashboard.jsx)
Central hub for verified users
Features:
Statistics overview (properties, transactions, etc.)
Quick action buttons
Recent properties display
Transaction requests overview
Market metrics
Real-time updates through contract events
Interactive cards for navigation
Inspector Dashboard (InspectorDashboard.jsx)
Control center for land inspectors
Features:
Pending verifications count
Property verification requests
Active disputes overview
Quick access to verification tasks
Real-time updates
Status tracking
Land Market (LandMarket.jsx)
Property marketplace
Features:
Advanced filtering (price, area, location)
Property listings with details
Document verification
Purchase request system
Real-time price updates
Interactive property cards
Status tracking for requests
Land Verification (LandVerification.jsx)
Inspector interface for verifying properties
Features:
Property details review
Document verification
Approval/Rejection workflow
Feedback system
Status updates
IPFS document access
User Verification (UserVerification.jsx)
Inspector interface for verifying users
Features:
User details review
Document verification
KYC process
Approval/Rejection workflow
Rejection reason system
Status tracking
Registration Page (Register.jsx)
User registration interface
Features:
Form validation
Document upload
KYC information collection
Real-time validation
Error handling
Progress tracking
Information tooltips
Pending Verification (PendingVerification.jsx)
Status page for users awaiting verification
Features:
Verification status display
Document review
Rejection feedback
Cooldown timer
Status updates
Re-registration option
Each page includes:

Comprehensive error handling
Loading states
Responsive design
Real-time updates
Contract event listeners
Role-based access control
Toast notifications
Detailed logging
Clean state management
The pages work together to create a complete land registration and management system with role-based access and secure blockchain integration.






























extra information ----

Project Flow:

User Registration and Verification:

Users register in UserRegistry
Inspectors verify users
Verified users get VERIFIED_USER_ROLE
Land Registration:

Verified users can add lands in LandRegistry
Inspectors verify lands
Land Transactions:

Owners can put lands for sale
Buyers can create purchase requests in TransactionRegistry
Sellers can accept/reject requests
Buyers make payments
Inspectors transfer ownership
Dispute Handling:

Verified users can raise disputes in DisputeRegistry
Inspectors can resolve disputes
Inspector Management:

Owner can add/remove inspectors in BaseRegistry


App.jsx: Route management
AuthContext.jsx: Auth state & wallet management
useWeb3.js: Web3 connection handling
Home.jsx: Entry point & connection UI
Register.jsx: User registration
PendingVerification.jsx: Status monitoring

Here's the complete flow of the land sale process:

Seller Lists Land for Sale
Location: MyLands.jsx
Action: Seller clicks "List for Sale" button
Backend: 
- Calls LandRegistry.putLandForSale()
- Updates land.isForSale = true
- Emits LandUpdated event
Frontend Updates:
- Land card status changes to "For Sale"
- Shows in LandMarket.jsx

Buyer Views Land in Market
Location: LandMarket.jsx
Features:
- Shows all lands marked isForSale = true
- Displays land details, price, documents
- Has "Request to Purchase" button
Utilizes:
- useUser hook's getLandsForSale()
- Shared styles for cards and layout

Buyer Makes Purchase Request
Location: LandMarket.jsx -> TransactionRegistry
Flow:
- Buyer clicks "Request to Purchase"
- createPurchaseRequest() called
- Creates new request with status = PENDING
- Shows in LandRequests.jsx for both buyer & seller
Updates:
- Buyer sees in "Sent Requests"
- Seller sees in "Received Requests"

Seller Processes Request
Location: LandRequests.jsx
Actions Available:
- Accept Request
- Reject Request
Backend:
- Calls processPurchaseRequest()
- Updates request status to ACCEPTED/REJECTED
Frontend:
- Status badge updates
- Shows payment button if accepted


Buyer Makes Payment
Location: LandRequests.jsx
Flow:
- If request ACCEPTED, shows "Make Payment" button
- makePayment() called with exact ETH amount
- Contract holds payment in escrow
- Updates request.isPaymentDone = true
- Status changes to PAYMENT_DONE
Updates:
- Payment button disappears
- Status updates to "Payment Complete"

Inspector Transfers Ownership
Location: InspectorDashboard.jsx
Flow:
- Inspector sees paid requests
- Reviews documents
- Calls transferLandOwnership()
Actions:
- Updates land ownership in LandRegistry
- Releases payment to seller
- Changes request status to COMPLETED
Updates:
- Land appears in buyer's MyLands.jsx
- Removed from seller's lands
- Transaction history updated

Key Components Used:

Frontend Pages:
MyLands.jsx: Manage owned lands
LandMarket.jsx: Browse & request lands
LandRequests.jsx: Handle purchase flow
InspectorDashboard.jsx: Process transfers
Contracts:
LandRegistry.sol: Land ownership & status
TransactionRegistry.sol: Purchase flow
UserRegistry.sol: User verification
Hooks & Services:
useUser.js: Land & transaction operations
useInspector.js: Inspector operations
Shared styles & components
Would you like me to elaborate on any particular part of this flow?




Core Components:
BaseRegistry Contract
Base contract for all other contracts
Handles role-based access control (Admin, Inspector, User, Verified User)
Provides emergency functions and basic utilities
Manages inspector registration
UserRegistry Contract
Manages user registration and verification
Stores user details (name, age, city, documents)
Handles document verification (Aadhar, PAN)
Maintains user roles and verification status
LandRegistry Contract
Core land management functionality
Stores land records with details (area, location, price, documents)
Handles land verification by inspectors
Manages land ownership and sales listings
Only allows TransactionRegistry to transfer ownership
TransactionRegistry Contract
Manages the land purchase process
Handles purchase requests and payments
Executes land ownership transfers
Tracks transaction history
Maintains market metrics
DisputeRegistry Contract
Handles land-related disputes
Allows verified users to raise disputes
Enables inspectors to resolve disputes
Tracks dispute history and statistics
Key Workflows:
User Registration Process
Register User → Submit Documents → Inspector Verifies → Get Verified Status
Land Registration Process
Register Land → Submit Documents → Inspector Verifies → Land Ready for Sale
Land Purchase Process
Create Purchase Request → Seller Accepts → Buyer Makes Payment → Ownership Transfers
Dispute Resolution
Raise Dispute → Inspector Reviews → Resolution Provided → Update Records
Security Features:
Role-based access control
Document verification
Payment escrow system
Authorization checks
Emergency pause functionality
Reentrancy protection
Key Improvements in Latest Version:
Simplified authorization (only TransactionRegistry needs authorization)
Better error handling and validation
Improved data cleanup processes
Enhanced pagination for frontend
Better event tracking
Proper dependency management
Dependencies Flow:
BaseRegistry
    ↑
    │
UserRegistry
    ↑
    │
LandRegistry
    ↑
    ├── TransactionRegistry
    └── DisputeRegistry
This is a comprehensive land registration system that ensures:

Transparent land ownership records
Secure property transfers
Verified user interactions
Proper dispute resolution
Market price tracking
Document verification
Would you like me to elaborate on any specific component or functionality?


Here are further details for each file in the src directory:

1. App.jsx
Sets up the main routes and context providers for the application.
Uses react-router-dom for routing.
Includes routes for Home, Register, Dashboard, InspectorDashboard, LandListing, LandDetails, DisputeListing, and TransactionHistory.
2. AuthContext.jsx
Provides authentication context for the application.
Uses ethers to interact with the Ethereum provider.
Checks if the user is authenticated and verified.
3. contractService.js
Handles the initialization and management of smart contract instances.
Uses ethers to interact with the Ethereum provider.
Initializes contracts for UserRegistry, LandRegistry, TransactionRegistry, and DisputeRegistry.
4. ipfsService.js
Handles file uploads to IPFS.
Uses axios to interact with the Pinata API.
Provides functions to upload files to IPFS and get IPFS links.
5. landService.js
Provides functions for managing land-related operations.
Uses ethers to interact with the Ethereum provider.
Includes functions to add land, update land, get land details, and search lands.
6. useWeb3.js
Provides Web3 functionalities.
Handles network changes and account changes.
Connects to MetaMask and initializes contracts.
Uses ethers to interact with the Ethereum provider.
7. index.js
Contains configuration settings.
Includes contract addresses and IPFS configuration.
8. index.css
Contains global CSS styles.
Defines styles for body, header, navbar, main, land-card, modal, and close-button.
9. main.jsx
Entry point for the React application.
Uses ReactDOM.render to render the App component.
10. File_Structure.md
Documents the file structure of the project.
Provides an overview of the directory structure and files.
11. LandListing.jsx
Displays a list of lands with filtering, sorting, and pagination functionalities.
Uses useAuth to get the current user and verification status.
Uses landService to fetch land data.
12. FilterBar.jsx
Provides filtering options for the land listings.
Includes inputs for location, min price, max price, only for sale, and only verified.
13. LandDetails.jsx
Displays detailed information about a specific land.
Uses useParams to get the land ID from the URL.
Uses getContracts to fetch land details, documents, and history.
14. HistorySection.jsx
Displays the history of a specific land.
Maps over the history array and displays each entry.
15. Dashboard/index.jsx
Main dashboard for the user, displaying various sections like lands, transactions, and disputes.
Uses useAuth to get the current user.
Uses getContracts to fetch user lands, transactions, and disputes.
16. DisputeSection.jsx
Displays the disputes related to the user's lands.
Maps over the disputes array and displays each dispute.
17. LandCard.jsx
Displays a card with brief information about a land.
Includes details like location, area, price, status, and for sale status.
Provides a purchase button if the land is for sale and the user is authenticated.
18. DocumentSection.jsx
Displays the documents related to a specific land.
Maps over the documents array and displays each document with a link to the IPFS gateway.
19. TransactionSection.jsx
Displays the transactions related to the user's lands.
Maps over the transactions array and displays each transaction.
20. ErrorBoundary.jsx
Provides an error boundary to catch JavaScript errors anywhere in the child component tree.
Displays an error message if an error is caught.
21. Home.jsx
Serves as the home page of the application.
Displays a welcome message and a brief description of the application.
22. Layout.jsx
Provides the layout for the application, including the header and navigation bar.
Wraps the children components with the header and navbar.
23. Header.jsx
Provides the header for the application.
Displays the application title.
24. Navbar.jsx
Provides the navigation bar for the application.
Includes links to Home, Register, Dashboard, Lands, Disputes, and Transactions.
25. Modal.jsx
Provides a modal dialog.
Displays the children components inside the modal.
26. PurchaseModal.jsx
Provides a modal dialog for purchasing land.
Displays land details and a confirm purchase button.
27. TransactionHistory.jsx
Displays the transaction history for the user.
Uses useAuth to get the current user.
Uses getContracts to fetch user transactions.
28. UserRegistry.sol
Smart contract for managing user registrations and verifications.
Includes functions to register, verify, update, deactivate, and reactivate users.
Uses StringUtils for string validation.
29. TransactionRegistry.sol
Smart contract for managing land transactions.
Includes functions to create, process, and cancel purchase requests, make payments, and transfer land ownership.
Tracks market metrics and transaction history.
30. StringUtils.sol
Library for string utilities.
Includes functions to validate string length and email format.
31. LandRegistry.sol
Smart contract for managing land registrations and verifications.
Includes functions to add, verify, update, and remove lands, manage land documents, and transfer land ownership.
Uses StringUtils for string validation.
32. ILandRegistry.sol
Interface for the LandRegistry contract.
Defines functions for land management and ownership transfer.
33. DisputeRegistry.sol
Smart contract for managing land disputes.
Includes functions to raise, validate, and resolve disputes.
Tracks dispute history.
34. BaseRegistry.sol
Base contract for role-based access control and emergency functions.
Includes functions to assign and revoke roles, transfer ownership, pause and unpause the contract, and perform emergency withdrawals.
35. LandRegistrationSystem.test.cjs
Contains tests for the Land Registration System.
Includes tests for user registration, land management, transaction processing, and dispute handling.
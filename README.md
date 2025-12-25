# LocaNutri Smart

## Product Overview

**Domain:** HealthTech (Nutrition & Diet Recommender)  
**Mission:** Democratizing personalized nutrition by bridging the gap between medical needs, local market prices, and household reality.

LocaNutri Smart is an innovative mobile/web application designed specifically for the Bangladeshi context, where affordability, local market fluctuations, and environmental factors play crucial roles in daily nutrition decisions. Unlike generic diet apps, LocaNutri Smart integrates real-time local pricing, weather conditions, and household inventory to provide practical, affordable, and safe nutritional guidance.

## Key Features

### 🛒 Feature 1: The "Smart Pantry" Context Engine
A digital inventory of what the user currently owns (Rice, Oil, Lentils, Vegetables) stored in the app.

**Why it matters:** Most diet apps suggest meals requiring new ingredients. LocaNutri Smart prioritizes food you already have. This is the single biggest factor in making a diet affordable for low-to-middle-income families.

**Key Capabilities:**
- **Scan-to-Add:** Users can snap a photo of their grocery receipt or product barcodes to instantly add items to their pantry list.
- **"Use-First" Alerts:** The app flags items that are sitting in the pantry too long, prompting the user to cook them before they spoil.

### 📉 Feature 2: Hyper-Local Price Optimization
A real-time diet generator that adapts to the fluctuating prices of Bangladesh's wet markets (Bazaars).

**Why it matters:** Nutritional advice is useless if it's too expensive. If the price of Broiler Chicken spikes, the app automatically suggests Pangas Fish or Eggs as a cheaper protein alternative for that week.

**Key Capabilities:**
- **Market Sync:** Connects to local price databases (e.g., Dept. of Agricultural Marketing) to know the daily cost of vegetables and proteins.
- **Budget Dial:** Users set a daily budget (e.g., "150 Taka/day"), and the app strictly recommends nutritious meals that fit within that limit.

### 🌤️ Feature 3: Weather-Adaptive Freshness Guard
An intelligent expiration tracker that adjusts food shelf-life based on real-time local weather.

**Why it matters:** In Bangladesh, high heat and humidity cause food to rot faster than the package date suggests. A static "Best Before" date is risky in a non-air-conditioned kitchen.

**Key Capabilities:**
- **Live Weather Sync:** The app checks the local humidity and temperature. If it's a hot, humid week (35°C+), it drastically reduces the "safe days" for leafy greens and milk.
- **Spoilage Alerts:** "High Humidity Warning: Your Spinach will spoil by tonight. Cook it now!"

### 🩺 Feature 4: Clinical & Allergen Safety Shield
A medical filtering layer that customizes recipes based on health conditions and doctor's advice.

**Why it matters:** High blood pressure and diabetes are rising epidemics in Bangladesh. Generic recipes can be dangerous if they contain too much salt or sugar.

**Key Capabilities:**
- **Disease Profiles:** Modes for Diabetic (Low Glycemic Index), Hypertensive (Low Salt), and Anemic (High Iron).
- **Allergen Lock:** Automatically hides recipes containing user-specific allergens (e.g., Shrimp/Prawns, Eggplant, Beef) to prevent allergic reactions.

### 🥘 Feature 5: Leftover "Upcycling" & Safety
A recipe suggestion engine specifically designed to transform cooked leftovers into safe, nutritious new meals.

**Why it matters:** Preventing waste saves money. However, saving cooked food (like Rice) carries health risks if done poorly.

**Key Capabilities:**
- **Safe Re-use:** Suggests recipes for leftovers (e.g., turning leftover rice into Fried Rice with veggies) but only if the food is deemed safe based on storage time and weather.
- **Safety Prompts:** "You are using 12-hour old rice. Please ensure it was refrigerated, otherwise, discard to avoid food poisoning."

### 🤖 Feature 6: AI-Powered Intelligent Dashboard
An intelligent analytics system that provides personalized insights, consumption patterns, and AI-driven recommendations.

**Key Capabilities:**
- **Smart Analytics:** AI-generated insights on consumption patterns, waste reduction, and nutritional habits
- **Chat Interface:** Interactive AI assistant for personalized food and nutrition advice
- **SDG Scoring:** Sustainability tracking with scores for waste reduction, nutrition, and budget management
- **Predictive Analytics:** Expiration risk assessment and waste prevention alerts

### 🏘️ Feature 7: Neighbourhood Food Sharing
A community platform for sharing surplus food with neighbors to reduce waste and build connections.

**Key Capabilities:**
- **Food Listings:** Share excess inventory items with pickup locations and availability times
- **Community Browse:** Discover and claim food shared by neighbors
- **Sharing Logs:** Track sharing activities and completed exchanges
- **Safety Verification:** Built-in safety checks for shared food items

### 📷 Feature 8: Smart Image Processing & OCR
Advanced image recognition and OCR technology for effortless food inventory management.

**Key Capabilities:**
- **Receipt Scanning:** Extract food items from grocery receipts using AI-powered OCR
- **Image Upload:** Upload and store food photos for inventory tracking
- **Auto-Extraction:** Automatically identify and categorize food items from images
- **Cloud Storage:** Secure image storage with Cloudinary integration

### 👨‍💼 Feature 9: Admin Management System
Administrative tools for managing the food catalog and educational resources.

**Key Capabilities:**
- **Food Catalog Management:** Add and manage food items with nutritional information
- **Resource Management:** Create and organize educational content
- **System Oversight:** Administrative dashboard for platform management

## Current Implementation Status

The application is currently in development with the following features implemented:

### ✅ Completed Features
- **Core Authentication:** User registration, login, and profile management with Clerk
- **Smart Pantry Engine:** Complete inventory management with food items, quantities, and expiration tracking
- **AI-Powered Dashboard:** Intelligent analytics with consumption patterns, SDG scoring, and AI chat interface
- **Neighbourhood Sharing:** Full food sharing system with listings, claims, and community features
- **OCR & Image Processing:** Receipt scanning, image upload, and AI-powered food extraction
- **Admin Panel:** Administrative tools for food catalog and resource management
- **Advanced Analytics:** Consumption patterns, expiration risk assessment, meal planning
- **Educational Resources:** Article and video content with tagging system
- **Daily Logging:** Consumption tracking and waste reduction monitoring
- **Responsive UI:** Modern, mobile-friendly interface with Tailwind CSS

### 🚧 In Development / Planned Features
- **Hyper-Local Price Optimization:** Real-time market price integration and budget optimization
- **Weather-Adaptive Freshness Guard:** Live weather API integration for expiration adjustments
- **Clinical & Allergen Safety Shield:** Health condition-based recipe filtering and allergen detection
- **Barcode Scanning:** Product barcode recognition for instant inventory addition
- **Advanced AI Features:** Enhanced meal recommendations and nutritional planning
- **Mobile App:** Native mobile applications for iOS and Android
- **Multi-language Support:** Localization for Bangladeshi regional languages
- **Offline Mode:** Limited functionality without internet connection

### 🧪 Testing & Quality Assurance
- **Backend Testing:** Jest framework with API endpoint testing
- **Database Testing:** Connection validation and migration testing
- **OCR Accuracy:** Image processing validation with Groq AI
- **UI Testing:** Component testing and user experience validation

## User Stories & Case Studies

### Case Study A: The Cost-Conscious Rickshaw Puller
**Profile:** Rahim, 35. Extremely high energy needs (3000+ calories/day), very low daily budget.

**The Problem:** Traditional diet apps suggest "Grilled Chicken and Quinoa" which is impossible for him. He needs energy but meat prices just doubled this week.

**LocaNutri Solution (Feature 2):** The Price Optimization Engine detects the price hike in meat. It generates a high-calorie meal plan using Lentils (Dal), Potato (Aloo), and Eggs, ensuring he gets his required protein and energy for 40% less cost than the meat-based option.

### Case Study B: The Diabetic Homemaker in Summer
**Profile:** Sumaiya, 45. Type-2 Diabetic. Manages a household kitchen without 24/7 air conditioning.

**The Problem:** She bought spinach and milk in the morning. It is an extremely hot and humid day (38°C). A standard app assumes these foods are good for 3 days.

**LocaNutri Solution (Feature 3 & 4):** The Weather-Adaptive Guard detects the heatwave. It sends her an alert at 4 PM: "High Heat Alert! Your spinach will lose nutrition and spoil by tomorrow. Please cook it for dinner tonight." The Clinical Shield ensures the suggested recipe uses minimal oil and no added sugar, keeping her blood sugar stable.

### Case Study C: The Garment Worker with Anemia
**Profile:** Fatema, 22. Works long shifts. Diagnosed with Anemia (Iron deficiency). Often skips meals to save money.

**The Problem:** She buys expensive imported apples because she thinks they are "healthy," wasting money. She ignores cheap local greens because she doesn't know their value.

**LocaNutri Solution (Feature 2 & 5):** The app suggests Local Superfoods. It recommends Kochu Shak (Taro Leaves) and Lal Shak (Red Amaranth)—which are incredibly cheap and rich in iron. It also prompts her to add a slice of Lemon (Vitamin C) to her meal to help her body absorb the iron, a zero-cost medical intervention.

### Case Study D: The "Leftover" Dilemma
**Profile:** A middle-class family with leftover Panta Bhat (soaked rice) from the previous night.

**The Problem:** They want to eat it to avoid waste, but the weather has been warm, and bacterial growth is a risk.

**LocaNutri Solution (Feature 5):** The user inputs "Leftover Soaked Rice." The app checks the local temperature history. It calculates that the risk of bacterial contamination is high because the kitchen was above 30°C overnight. It advises: "Risk of bacterial growth detected. Do not consume raw. Thoroughly fry with onions and chilies to ensure safety, or discard."

## Technology Stack

### Frontend (Client)
- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS 4
- **Routing:** React Router DOM 7
- **State Management:** React Context + TanStack React Query
- **Authentication:** Clerk React
- **Icons:** Lucide React
- **Date Handling:** date-fns + React Datepicker
- **HTTP Client:** Fetch API with custom authentication wrapper
- **UI Components:** Custom components with accessibility support

### Backend (Server)
- **Runtime:** Node.js
- **Framework:** Express.js 5
- **Database:** PostgreSQL with Prisma ORM 6
- **Authentication:** Clerk SDK for Node.js
- **AI Integration:** Groq AI for OCR and intelligent insights
- **File Storage:** Cloudinary for image uploads
- **Security:** Helmet, CORS, Compression
- **File Upload:** express-fileupload middleware
- **OCR Processing:** Tesseract.js with trained data
- **Testing:** Jest with Supertest
- **Development:** Nodemon, ts-node

### Database Schema
The application uses PostgreSQL with the following main entities:
- **Users & Profiles:** User authentication and profile management
- **Food Items:** Catalog of food items with categories, expiration info, and costs
- **Inventories:** User-created inventories for tracking household food
- **Inventory Items:** Specific food items in inventories with quantities and expiration dates
- **Consumption Logs:** Tracking of food consumption for waste reduction
- **Resources:** Educational content (articles/videos) with tagging system
- **Files:** File upload support for food photos and receipts
- **Food Listings:** Neighbourhood food sharing listings
- **Sharing Logs:** Tracking of food sharing transactions
- **AI Insights:** Stored AI-generated analytics and recommendations
- **Consumption Patterns:** Historical consumption pattern analysis
- **Expiration Risk:** Predictive expiration risk assessments
- **Meal Plans:** Generated meal planning data
- **Chat Sessions:** AI chat conversation history
- **SDG Scores:** Sustainability scoring and achievements

### Architecture
- **Full-Stack:** Separate client and server directories
- **API Design:** RESTful API with `/api` prefix
- **Authentication:** Clerk-based auth with protected routes
- **Database:** Prisma-managed migrations and client generation
- **File Structure:** Modular backend with feature-based organization

## Project Structure

```
LocaNutri-Smart/
├── client/                          # React frontend application
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── AdminProtectedRoute.tsx    # Admin route protection
│   │   │   ├── AIResponseDisplay.tsx      # AI response rendering
│   │   │   ├── Layout.tsx                 # Main app layout with sidebar
│   │   │   ├── MarkdownRenderer.tsx       # Markdown content renderer
│   │   │   ├── Sidebar.tsx                # Navigation sidebar
│   │   │   ├── food/                      # Food-related components
│   │   │   │   ├── AddFoodModal.tsx       # Modal for adding food items
│   │   │   │   ├── FoodFilter.tsx         # Food filtering component
│   │   │   │   ├── FoodList.tsx           # Food items list display
│   │   │   │   └── OCRUpload.tsx          # OCR image upload component
│   │   │   ├── home/                      # Landing page components
│   │   │   │   ├── HeroSection.tsx
│   │   │   │   ├── FeaturesSection.tsx
│   │   │   │   ├── CTASection.tsx
│   │   │   │   ├── HowItWorksSection.tsx
│   │   │   │   ├── ImpactSection.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── Navbar.tsx
│   │   │   ├── inventory/                 # Inventory components
│   │   │   │   └── ImageUploadModal.tsx   # Image upload modal
│   │   │   ├── neighbourhood/             # Community sharing components
│   │   │   │   ├── AvailableListings.tsx  # Browse available food
│   │   │   │   ├── CreateListing.tsx      # Create food listing
│   │   │   │   ├── ListingCard.tsx        # Food listing card
│   │   │   │   ├── MyListings.tsx         # User's listings
│   │   │   │   ├── sharing-service.ts     # Sharing API service
│   │   │   │   └── types.ts               # Sharing type definitions
│   │   │   ├── admin/                     # Admin components
│   │   │   │   ├── AddFoodModal.tsx       # Admin food addition
│   │   │   │   └── AddResourceModal.tsx   # Admin resource addition
│   │   │   └── resources/                 # Resource display components
│   │   │       └── ResourceCard.tsx
│   │   ├── pages/                         # Page components
│   │   │   ├── Home.tsx                   # Landing page
│   │   │   ├── Dashboard.tsx              # User dashboard
│   │   │   ├── IntelligentDashboard.tsx   # AI-powered dashboard
│   │   │   ├── AdminDashboard.tsx         # Admin dashboard
│   │   │   ├── InventoryPage.tsx          # Inventory management
│   │   │   ├── InventoryDetailPage.tsx    # Individual inventory details
│   │   │   ├── DailyLogPage.tsx           # Daily consumption logging
│   │   │   ├── ProfilePage.tsx            # User profile
│   │   │   ├── EditProfilePage.tsx        # Profile editing
│   │   │   ├── ResourcesPage.tsx          # Educational resources
│   │   │   ├── NeighbourhoodPage.tsx      # Community sharing
│   │   │   ├── SignInPage.tsx             # Authentication
│   │   │   ├── SignUpPage.tsx
│   │   │   └── OnboardingPage.tsx         # User onboarding
│   │   ├── services/                      # API service functions
│   │   │   ├── authService.ts             # Authentication helpers
│   │   │   ├── inventoryService.ts        # Inventory API calls
│   │   │   ├── resources-service.ts       # Resources API calls
│   │   │   └── utils.ts                   # Utility functions
│   │   ├── hooks/                         # Custom React hooks
│   │   │   ├── useApi.ts                  # API call hooks
│   │   │   └── useInventory.ts            # Inventory-specific hooks
│   │   ├── context/                       # React context providers
│   │   │   └── ProfileContext.tsx         # User profile context
│   │   │   ├── types/                     # TypeScript type definitions
│   │   │   │   └── inventory.ts           # Inventory-related types
│   │   │   └── utils/                     # Utility functions
│   │   │       └── textUtils.ts           # Text processing utilities
│   │   └── assets/                        # Static assets
│   ├── public/                            # Public static files
│   └── package.json                       # Frontend dependencies
├── server/                                # Node.js backend application
│   ├── src/
│   │   ├── modules/                       # Feature modules
│   │   │   ├── foods/                     # Food items management
│   │   │   │   ├── food-controller.ts
│   │   │   │   └── food-router.ts
│   │   │   ├── inventories/               # Inventory system
│   │   │   │   ├── inventory-controller.ts
│   │   │   │   ├── inventory-router.ts
│   │   │   │   ├── inventory-service.ts
│   │   │   │   └── inventory-types.ts
│   │   │   ├── resources/                 # Educational resources
│   │   │   │   ├── resources-controller.ts
│   │   │   │   ├── resources-repository.ts
│   │   │   │   └── resources-router.ts
│   │   │   ├── users/                     # User management
│   │   │   │   ├── users-controller.ts
│   │   │   │   ├── users-router.ts
│   │   │   │   ├── users-service.ts
│   │   │   │   └── users-types.ts
│   │   │   ├── admin/                     # Admin functionality
│   │   │   │   ├── admin-controller.ts
│   │   │   │   ├── admin-router.ts
│   │   │   │   └── admin-service.ts
│   │   │   ├── images/                    # Image upload system
│   │   │   │   ├── image-controller.ts
│   │   │   │   ├── image-router.ts
│   │   │   │   ├── image-service.ts
│   │   │   │   └── image-types.ts
│   │   │   ├── intelligence/              # AI analytics
│   │   │   │   └── intelligence-controller.ts
│   │   │   └── sharing/                   # Neighbourhood sharing
│   │   │       ├── sharing-controller.ts
│   │   │       ├── sharing-router.ts
│   │   │       ├── sharing-service.ts
│   │   │       └── sharing-types.ts
│   │   ├── config/                        # Configuration files
│   │   │   ├── app.ts                      # App configuration
│   │   │   │   ├── clerk.ts                # Clerk auth config
│   │   │   │   ├── cloudinary.ts           # Cloudinary config
│   │   │   │   └── database.ts             # Database connection
│   │   ├── middleware/                     # Express middleware
│   │   │   ├── auth.ts                     # Authentication middleware
│   │   │   ├── fileUpload.ts               # File upload middleware
│   │   │   └── index.ts                    # Middleware setup
│   │   ├── services/                       # Business logic services
│   │   │   ├── aiAnalyticsService.ts      # AI analytics service
│   │   │   └── ocr-service.ts             # OCR processing service
│   │   ├── utils/                          # Utility functions
│   │   │   └── uploadImage.ts              # Image upload utilities
│   │   └── *.ts                            # Main app files (index, server, router)
│   ├── prisma/                             # Database schema and migrations
│   │   ├── schema.prisma                   # Database schema
│   │   ├── seed.ts                         # Database seeding
│   │   ├── seed-specific-users.ts          # Specific user seeding
│   │   └── migrations/                     # Prisma migrations
│   ├── docs/                               # API documentation
│   │   └── api-docs.md                     # API reference
│   ├── eng.traineddata                     # OCR trained data
│   └── package.json                        # Backend dependencies
├── test-connection.ts               # Database connection test script
└── README.md                        # This file
```

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- Clerk account for authentication (get API keys from [Clerk Dashboard](https://dashboard.clerk.com/))

### Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Configure the following variables:
     ```env
     DATABASE_URL="postgresql://username:password@localhost:5432/locanutri_db"
     CLERK_SECRET_KEY="your_clerk_secret_key"
     PORT=3000
     NODE_ENV=development
     ```

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. (Optional) Seed the database with sample data:
   ```bash
   npx prisma db seed
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:3000`

### Frontend Setup
1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env.local` file with:
     ```env
     VITE_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
     VITE_API_URL="http://localhost:3000/api"
     ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   The client will run on `http://localhost:5173`

### Testing Database Connection
To test the database connection, run:
```bash
npx ts-node test-connection.ts
```

### Running Tests
- Backend tests: `cd server && npm test`
- Frontend tests: `cd client && npm test` (if configured)

## Usage

1. **Access the application:**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3000/api`

2. **Authentication:**
   - Sign up/login using Clerk authentication
   - Complete the onboarding process to set up your profile

3. **Core Features:**
   - **Dashboard:** Overview of your food inventory and recent activity
   - **Intelligent Dashboard:** AI-powered analytics with consumption patterns and SDG scoring
   - **Inventory Management:** Create and manage multiple inventories (e.g., kitchen, pantry)
   - **OCR Receipt Scanning:** Upload grocery receipts to automatically add items
   - **Image Upload:** Attach photos to inventory items for better tracking
   - **Consumption Logging:** Track daily food consumption and waste reduction
   - **Neighbourhood Sharing:** Share surplus food with neighbors or browse available listings
   - **AI Chat Assistant:** Get personalized nutrition and food management advice
   - **Admin Panel:** Manage food catalog and resources (admin users)
   - **Educational Resources:** Access articles and videos about nutrition and sustainability

4. **API Health Check:** Visit `http://localhost:3000/api/health` to verify the backend is running

## API Documentation

The backend provides a RESTful API with the following main endpoints:

- **Public Routes:**
  - `GET /api/foods` - Food catalog with filtering
  - `GET /api/resources` - Educational resources
  - `GET /api/health` - Health check

- **Protected Routes (require authentication):**
  - `GET/POST/PUT/DELETE /api/inventories` - Inventory management
  - `GET/POST/PUT/DELETE /api/inventories/:id/items` - Inventory items
  - `POST /api/inventories/consumption` - Log food consumption
  - `GET /api/users/profile` - User profile management
  - `GET/POST /api/sharing/listings` - Neighbourhood food sharing
  - `POST /api/images/upload` - Image upload for receipts/photos
  - `GET/POST /api/intelligence/dashboard` - AI-powered analytics
  - `POST /api/intelligence/chat` - AI chat interface
  - `GET/POST /api/admin/foods` - Admin food catalog management (admin only)

Detailed API documentation is available in [server/docs/api-docs.md](server/docs/api-docs.md).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
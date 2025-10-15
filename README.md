# AI-Powered E-Commerce Recommendation System

A full-stack web application that provides intelligent product recommendations based on uploaded product catalogs and user behavior data. The system features **advanced multi-strategy product extraction** from PDF catalogs, **MongoDB persistence**, and **AI-powered recommendations** using multiple LLM models.

## 🚀 Features

### Core Functionality
- **📄 Smart PDF Catalog Upload**: Multi-strategy product extraction (Regex → LLM → Heuristic)
- **🤖 AI-Powered Recommendations**: Get personalized product recommendations with detailed explanations
- **🎯 Dual Query Modes**: Ask questions OR get recommendations based on preferences
- **💾 Database Persistence**: All products, interactions, and uploads stored in MongoDB
- **📊 Product Browser**: Search and filter products with text search, category, and price range
- **📈 Interaction History**: Track all user queries and AI responses with timestamps
- **🎨 Modern Pink Theme UI**: Beautiful gradient design with responsive layout

### Advanced Product Extraction
- **3 Extraction Strategies**: Automatic fallback system
  1. **Regex Parsing** - Fast extraction for structured catalogs (4 pattern formats)
  2. **LLM Extraction** - GPT-4o-mini for unstructured text analysis
  3. **Heuristic Parsing** - Price-based detection as final fallback
- **Smart Deduplication**: 85% similarity threshold using Levenshtein distance
- **Auto-Categorization**: Infers categories from keywords across 8 categories
- **Tag Extraction**: Automatic keyword extraction from titles and descriptions
- **Duplicate Handling**: Gracefully skips existing products in database

### User Experience
- **Session Tracking**: Automatic session management with localStorage
- **Real-time Feedback**: Detailed extraction statistics (found/saved/duplicates)
- **Tabbed Navigation**: Query, Products, and History views
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Error Handling**: Comprehensive error messages and validation

## 🏗️ Project Structure

```
unthinkable/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── CatalogUploader.jsx           # PDF upload with extraction stats
│   │   │   ├── RecommendationDashboard.jsx   # Tabbed dashboard (Query/Products/History)
│   │   │   ├── RecommendationList.jsx        # Display AI recommendations
│   │   │   ├── RecommendForm.jsx             # Dual mode (Ask/Recommend)
│   │   │   ├── ProductBrowser.jsx            # Browse/search products [NEW]
│   │   │   └── InteractionHistory.jsx        # View interaction history [NEW]
│   │   ├── utils/
│   │   │   └── api.js                        # Centralized API layer [NEW]
│   │   ├── App.jsx          # Main app with pink theme
│   │   ├── App.css          # Component styles
│   │   ├── index.css        # Global styles and theme
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── server/                 # Backend Express.js application
    ├── src/
    │   └── server.js                         # Main server file
    ├── models/                               # MongoDB schemas [NEW]
    │   ├── Product.js                        # Product catalog schema
    │   ├── UserInteraction.js                # Interaction tracking
    │   └── CatalogUpload.js                  # Upload metadata
    ├── controllers/
    │   └── chat.controllers.js               # Multi-strategy extraction + AI
    ├── routes/
    │   └── chat.routes.js                    # 6 API endpoints
    ├── database_connection/
    │   └── db.js                             # MongoDB connection
    ├── package.json
    └── PRODUCT_EXTRACTION_GUIDE.md           # Detailed extraction docs [NEW]
```

## 🛠️ Technologies Used

### Frontend
- **React 19.1.1** - Modern UI framework with hooks
- **Vite 7.1.7** - Lightning-fast build tool and dev server
- **CSS3** - Custom properties, gradients, and animations
- **ESLint** - Code quality and consistency

### Backend
- **Node.js** with **Express.js 5.1.0** - RESTful API server
- **MongoDB** with **Mongoose 8.19.1** - NoSQL database with schemas
- **Multer 2.0.2** - Multipart/form-data file upload
- **pdf-parse 2.2.6** - PDF text extraction
- **Axios 1.12.2** - HTTP client for AI API calls
- **CORS 2.8.5** - Cross-origin resource sharing
- **dotenv 17.2.3** - Environment variable management
- **Nodemon 3.1.10** - Development auto-restart

### AI & Machine Learning
- **OpenRouter API** - Multi-model AI gateway
  - **Claude 3.5 Sonnet** - Primary recommendation engine
  - **GPT-4o-mini** - Product extraction from unstructured text
  - **Mistral 7B** - Fallback model
- **Custom Algorithms** - Levenshtein distance for deduplication

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- OpenRouter API key for LLM functionality

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd unthinkable
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Configuration**
   
   Create a `.env` file in the `server` directory (or copy from `.env.example`):
   ```env
   PORT=8000
   MONGODB=mongodb://localhost:27017/recommendations
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```
   
   **Note**: A `.env.example` file is provided in the server directory as a template.

## 🚀 Running the Application

### Development Mode

1. **Start the backend server**
   ```bash
   cd server
   npm start
   ```
   Server will run on `http://localhost:8000`

2. **Start the frontend development server**
   ```bash
   cd client
   npm run dev
   ```
   Client will run on `http://localhost:5173`

### Production Build

1. **Build the client**
   ```bash
   cd client
   npm run build
   ```

2. **Preview the production build**
   ```bash
   npm run preview
   ```

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/pdf-upload` | Upload PDF catalog with multi-strategy extraction |
| POST | `/api/chat/ask` | Ask questions about products (AI-powered) |
| POST | `/api/chat/recommend` | Get personalized recommendations based on preferences |
| GET | `/api/chat/products` | Retrieve all products with optional filters |
| POST | `/api/chat/products` | Manually add a product to catalog |
| GET | `/api/chat/interactions` | Get user interaction history |

### Request/Response Examples

**Upload PDF Catalog**
```bash
POST /api/chat/pdf-upload
Content-Type: multipart/form-data
X-Session-Id: session-123
X-User-Id: user-456

Response:
{
  "message": "PDF uploaded and text extracted successfully.",
  "textLength": 5432,
  "productsExtracted": 10,
  "totalFound": 15,
  "duplicatesSkipped": 2,
  "catalogId": "507f1f77bcf86cd799439011",
  "status": "processed"
}
```

**Get Recommendations**
```bash
POST /api/chat/recommend
Content-Type: application/json
X-Session-Id: session-123

Body:
{
  "preferences": "running shoes, lightweight, under $100",
  "context": "marathon training"
}

Response:
{
  "response": "Based on your preferences, I recommend...",
  "products": [...],
  "interactionId": "507f1f77bcf86cd799439011"
}
```

## 📝 Usage

### 1. Upload Product Catalog
- Navigate to the **"Upload Catalog"** section
- Select a PDF file containing your product catalog
- System automatically extracts products using 3 strategies:
  - **Regex**: For structured formats (dash/pipe/CSV-like)
  - **LLM**: For unstructured narrative text
  - **Heuristic**: For simple price lists
- View extraction statistics (total found, saved, duplicates skipped)
- Products are automatically categorized and stored in MongoDB

### 2. Query Products (Ask Mode)
- Click **"Ask"** in the recommendation form
- Type questions like:
  - "What running shoes do you have under $100?"
  - "Show me products in the footwear category"
  - "What's the best shoe for marathon training?"
- AI analyzes your query and provides detailed answers with product suggestions

### 3. Get Recommendations (Recommend Mode)
- Click **"Recommend"** in the recommendation form
- Fill in preferences:
  - **Budget**: Price range
  - **Category**: Product type
  - **Keywords**: Specific features (e.g., "lightweight", "breathable")
  - **Context**: Use case or occasion
- AI generates personalized recommendations with explanations

### 4. Browse Products
- Click **"Products"** tab in the dashboard
- Search products by text
- Filter by category (Footwear, Clothing, Electronics, Sports, etc.)
- Filter by price range
- View product details: title, description, price, stock, tags

### 5. View Interaction History
- Click **"History"** tab in the dashboard
- See all your past queries and recommendations
- Filter by interaction type (ask/recommend)
- Review AI responses and timestamps
- Track your shopping journey

### Supported PDF Formats

**Format 1: Structured (Dash-separated)**
```
Running Shoe Pro - Footwear - $89.99 - Lightweight running shoe
Athletic Shorts - Clothing - $34.99 - Breathable workout shorts
```

**Format 2: Natural Language**
```
Our catalog features premium running shoes. The RunMaster 3000 
costs $99 and provides exceptional comfort for runners.
```

**Format 3: Simple Price List**
```
Running Shoe Pro $89.99
Athletic Shorts $34.99
Sports Watch $129.99
```

All formats are automatically detected and parsed!

## 🔒 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port number | No | 8000 |
| `MONGODB` | MongoDB connection string | Yes | - |
| `OPENROUTER_API_KEY` | API key for OpenRouter LLM service | Yes | - |

### MongoDB Setup Options

**Option 1: Local MongoDB**
```env
MONGODB=mongodb://localhost:27017/recommendations
```

**Option 2: MongoDB Atlas (Cloud)**
```env
MONGODB=mongodb+srv://username:password@cluster.mongodb.net/recommendations
```

### Database Collections

The application automatically creates these collections:
- `products` - Product catalog with text indexes
- `userinteractions` - Query and recommendation history
- `cataloguploads` - PDF upload metadata and extraction stats

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🐛 Known Issues & Limitations

### Current Limitations
- PDF upload limited to 10MB file size
- Text extraction doesn't work on image-only (scanned) PDFs
- Maximum 5000 characters processed for product extraction
- LLM extraction uses ~2-5 seconds due to API latency
- Session data stored in localStorage (cleared on browser data wipe)

### Troubleshooting

**No products extracted from PDF?**
- ✅ Verify PDF contains extractable text (not scanned images)
- ✅ Check prices are in format `$XX.XX`
- ✅ Ensure text has clear product boundaries

**Products in wrong categories?**
- ✅ Add category keywords to descriptions (shoe, shirt, phone, etc.)
- ✅ Manually update via POST `/api/chat/products` endpoint

**Duplicate products appearing?**
- ✅ System auto-deduplicates based on 85% title similarity
- ✅ Duplicates by SKU are automatically skipped

**MongoDB connection errors?**
- ✅ Verify MongoDB is running: `mongod --version`
- ✅ Check `MONGODB` variable in `.env` file (not `MONGODB_URI`)
- ✅ Ensure network access (for MongoDB Atlas)
- ✅ For local setup: Start MongoDB service before running the server

**CORS errors in browser?**
- ✅ Configured for `http://localhost:5173` by default
- ✅ Update `server/src/server.js` for different origins

### Performance Notes
- Regex parsing: ~10ms for 5000 chars
- LLM extraction: ~2-5 seconds (API dependent)
- Heuristic parsing: ~50ms for 5000 chars
- Database queries: ~50-100ms with indexes

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes** and test thoroughly
4. **Commit with descriptive messages**
   ```bash
   git commit -m 'Add: Multi-language support for product descriptions'
   ```
5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request** with detailed description

### Areas for Contribution
- 🖼️ Image recognition for scanned PDFs (OCR integration)
- 📊 Excel/CSV catalog upload support
- 🌍 Multi-language support for international products
- 🎨 Additional UI themes (dark mode, accessibility)
- 📱 Progressive Web App (PWA) or mobile app
- 🔍 Advanced search with faceted filters
- 📈 Analytics dashboard with charts
- 🧪 Unit and integration tests (Jest, React Testing Library)
- 🔐 User authentication and authorization
- 🎯 A/B testing for recommendation algorithms

## 🚀 Future Enhancements

- [ ] Image-based product extraction (OCR)
- [ ] Excel/CSV file upload support
- [ ] Bulk product editing interface
- [ ] User authentication and profiles
- [ ] Wishlist and favorites
- [ ] Price tracking and alerts
- [ ] Product comparison feature
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Mobile responsive improvements
- [ ] Real-time collaborative recommendations
- [ ] Integration with e-commerce platforms
- [ ] Product image storage and display
- [ ] Review and rating system

## 📚 Additional Documentation

For more detailed information about specific features:
- Check the inline code comments in the controller files
- Review the API endpoint documentation above
- Explore the component files for frontend implementation details

## 📄 License

This project is licensed under the **ISC License**.

## 📞 Support

Need help? Here's how to get support:

-  [Open an issue](https://github.com/Shreeyalisingh/ecommerce-product-recommendations/issues) on GitHub
- 💬 Start a discussion in the repository
- 📧 Contact the maintainers
- 📖 Check the project documentation and README

## 🙏 Acknowledgments

- **OpenRouter** - Multi-model AI API gateway
- **Anthropic** - Claude 3.5 Sonnet model
- **OpenAI** - GPT-4o-mini for text extraction
- **Mistral AI** - Mistral 7B fallback model
- **MongoDB** - Flexible NoSQL database
- **React Team** - Amazing UI framework
- **Vite** - Lightning-fast build tool

---

**Made with ❤️ using React, Express.js, MongoDB, and AI**

*Transform your product catalogs into intelligent recommendation systems with the power of AI!* 🚀
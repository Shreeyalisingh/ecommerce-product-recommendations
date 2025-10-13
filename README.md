# Product Recommendation Dashboard

A full-stack web application that provides intelligent product recommendations based on uploaded product catalogs and user behavior data. The system leverages Large Language Models (LLM) to generate explanations for recommendations.

## 🚀 Features

- **PDF Catalog Upload**: Upload product catalogs in PDF format for processing
- **Intelligent Recommendations**: Get product recommendations based on user behavior
- **LLM Explanations**: Receive detailed explanations for why products were recommended
- **Real-time Dashboard**: Interactive React-based dashboard for seamless user experience
- **RESTful API**: Express.js backend with MongoDB integration

## 🏗️ Project Structure

```
unthinkable/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── CatalogUploader.jsx      # PDF catalog upload component
│   │   │   ├── RecommendationDashboard.jsx  # Main dashboard
│   │   │   ├── RecommendationList.jsx   # Display recommendations
│   │   │   └── RecommendForm.jsx        # User behavior input form
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── server/                 # Backend Express.js application
    ├── src/
    │   └── server.js       # Main server file
    ├── controllers/
    │   └── chat.controllers.js  # API logic and LLM integration
    ├── routes/
    │   └── chat.routes.js  # API routes
    ├── database_connection/
    │   └── db.js          # MongoDB connection
    └── package.json
```

## 🛠️ Technologies Used

### Frontend
- **React 19.1.1** - UI framework
- **Vite** - Build tool and development server
- **ESLint** - Code linting

### Backend
- **Node.js** with **Express.js 5.1.0** - Server framework
- **MongoDB** with **Mongoose 8.19.1** - Database
- **Multer** - File upload handling
- **pdf-parse** - PDF text extraction
- **Axios** - HTTP client for LLM API calls
- **CORS** - Cross-origin resource sharing

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
   
   Create a `.env` file in the `server` directory:
   ```env
   PORT=8000
   MONGODB_URI=mongodb://localhost:27017/recommendations
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

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
| POST | `/api/chat/pdf-upload` | Upload PDF catalog for processing |
| POST | `/api/chat/ask` | Get recommendations based on user behavior |

## 📝 Usage

1. **Upload Product Catalog**: Use the catalog uploader to submit a PDF containing your product information
2. **Input User Behavior**: Fill out the recommendation form with user preferences and behavior data
3. **View Recommendations**: The system will display recommended products along with LLM-generated explanations
4. **Analyze Results**: Review the detailed explanations to understand the recommendation logic

## 🔒 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port number | No (default: 8000) |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `OPENROUTER_API_KEY` | API key for OpenRouter LLM service | Yes |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🐛 Known Issues

- PDF parsing supports multiple strategies for better compatibility
- File upload limit is set to 10MB for PDF files
- CORS is configured for development (localhost:5173)

## 📞 Support

If you encounter any issues or have questions, please open an issue in the repository.

---

**Made with ❤️ using React, Express.js, and AI**
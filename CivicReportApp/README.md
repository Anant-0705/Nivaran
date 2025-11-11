# Smart Civic Issue Reporting App

A React Native mobile application built with Expo that allows citizens to report civic issues, upvote community problems, and track their impact through a rewards system.

## 🚀 Features

### 📱 Core Features
- **User Authentication**: Secure signup/login system with Supabase Auth
- **Issue Reporting**: Capture photos, add descriptions, and auto-tag location
- **Interactive Map**: View issues on an interactive Leaflet map
- **Community Engagement**: Upvote issues to prioritize community concerns
- **Rewards System**: Earn points for reporting and upvoting issues
- **Real-time Updates**: Live synchronization with Supabase backend

### 🗺️ Map Features
- Interactive Leaflet map integration
- Real-time issue markers with categories
- Auto-location detection
- Detailed issue popups
- Current location tracking

### 🏆 Gamification
- Points system for user engagement
- Achievement levels (Beginner, Bronze, Silver, Gold, Diamond)
- Activity tracking and history
- Leaderboard potential

## 🛠️ Tech Stack

- **Frontend**: React Native with Expo
- **Navigation**: React Navigation
- **Backend**: Supabase (PostgreSQL database)
- **Authentication**: Supabase Auth
- **Maps**: Leaflet with react-leaflet
- **UI Components**: React Native Elements + Custom Components
- **State Management**: React Hooks
- **Location Services**: Expo Location
- **Image Handling**: Expo Image Picker

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI: `npm install -g @expo/cli`
- Expo Go app on your mobile device (for testing)

## 🚀 Getting Started

### 1. Clone and Install
```bash
git clone <repository-url>
cd CivicReportApp
npm install
```

### 2. Set Up Supabase
Follow the detailed instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) to:
- Create a Supabase project
- Set up database tables
- Configure authentication
- Get your API keys

### 3. Configure Environment
Update `src/services/supabase.ts` with your Supabase credentials:
```typescript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
```

### 4. Run the App
```bash
# Start the development server
npm start

# Run on specific platforms
npm run android
npm run ios
npm run web
```

### 5. Test on Device
- Install Expo Go on your mobile device
- Scan the QR code from the terminal/browser
- The app will load on your device

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── navigation/          # Navigation configuration
├── screens/            # Screen components
│   ├── LoginScreen.tsx
│   ├── RegisterScreen.tsx
│   ├── MapScreen.tsx
│   ├── ReportIssueScreen.tsx
│   ├── RewardsScreen.tsx
│   └── ProfileScreen.tsx
├── services/           # API and business logic
│   ├── authService.ts
│   ├── issueService.ts
│   ├── locationService.ts
│   └── supabase.ts
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🎯 How to Use

### For Citizens:
1. **Sign Up/Login**: Create an account or log in
2. **Report Issues**: 
   - Tap "Report" tab
   - Add title, description, category
   - Take/select a photo (optional)
   - Location is auto-detected
   - Submit the report
3. **View Issues**: Browse issues on the interactive map
4. **Engage**: Upvote issues you care about
5. **Track Progress**: View your points and achievements in Rewards tab

### For Administrators:
- Issues can be updated through the Supabase dashboard
- Status can be changed (open → in_progress → resolved → closed)
- Analytics available through Supabase

## 🌟 Key Features Explained

### Issue Categories
- **Infrastructure**: Roads, bridges, utilities
- **Safety**: Street lighting, dangerous areas
- **Environment**: Pollution, waste management
- **Transport**: Public transport, traffic issues
- **Other**: Miscellaneous community concerns

### Points System
- Report an issue: +10 points
- Upvote an issue: +5 points
- Achievements unlock at different point thresholds

### Map Integration
- Uses OpenStreetMap tiles via Leaflet
- Real-time issue markers
- Location-based filtering
- Interactive popups with issue details

## 🔧 Customization

### Adding New Features
1. Create new screen in `src/screens/`
2. Add route in `src/navigation/AppNavigator.tsx`
3. Implement business logic in `src/services/`
4. Update types in `src/types/index.ts`

### Styling
- Modify styles in individual component files
- Global theme can be implemented
- Uses React Native StyleSheet

### Database Schema
- Extend tables in Supabase as needed
- Update TypeScript types accordingly
- Modify service functions for new fields

## 🐛 Troubleshooting

### Common Issues
1. **Location not working**: Enable location permissions
2. **Map not loading**: Check internet connection
3. **Auth errors**: Verify Supabase credentials
4. **Build issues**: Clear npm cache and reinstall

### Debug Mode
```bash
# Enable debug mode
npm start -- --dev-client
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Supabase for backend infrastructure
- Expo team for the excellent development platform
- OpenStreetMap for map data
- React Native community for components and tools

## 📞 Support

For issues and questions:
1. Check existing issues in the repository
2. Create a new issue with detailed description
3. Include device/platform information
4. Provide steps to reproduce

## 🔄 Updates

Stay updated with the latest features:
- Follow the repository for updates
- Check releases for new versions
- Review changelog for breaking changes

---

**Happy Civic Reporting! 🏙️📱**

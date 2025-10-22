# Mobile App Implementation Plan with Capacitor

## Overview
Convert the Next.js frontend into a native mobile application using Capacitor, enabling deployment to iOS and Android platforms while maintaining the existing web functionality.

## Prerequisites
- Existing Next.js application with React 19
- Node.js and npm installed
- Xcode (for iOS development)
- Android Studio (for Android development)

---

## ⚠️ Phase 0: Pre-Mobile Prerequisites [CRITICAL]

### Task 0.1: Restore or Deploy API Backend
**STATUS: BLOCKER** - API routes have been deleted without backend deployment
- [ ] Restore deleted API routes from git history
- [ ] Deploy backend APIs to chosen hosting platform (see Phase 1.5)
- [ ] Test all API endpoints remotely
- [ ] Update frontend to use remote API URLs
- [ ] Document all API endpoints and authentication

**Without working APIs, the mobile app cannot function.**

---

## Phase 1: Capacitor Setup & Configuration

### Task 1.1: Install Capacitor Dependencies
```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init
```
- Initialize Capacitor configuration with proper app ID and name
- Verify installation success

### Task 1.2: Configure Next.js for Static Export

#### Task 1.2.1: TypeScript & Path Configuration
- Update tsconfig.json if using path aliases
- Ensure all imports use relative or absolute paths
- Verify no server-only imports in client components
- Add type definitions for Capacitor plugins

#### Task 1.2.2: Update next.config.ts
Update `next.config.ts` with the following configuration:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',           // Enable static export
  trailingSlash: true,        // Better mobile compatibility
  images: {
    unoptimized: true,        // Required for Capacitor
  },
  // Remove any serverActions or server-side only features
};

export default nextConfig;
```

- Ensure all API routes are converted to work with static generation or moved to external backend
- Test static build: `npm run build`
- Verify output in `out/` directory

### Task 1.3: Update Build Scripts
Add the following scripts to `package.json`:
```json
{
  "scripts": {
    "build:mobile": "next build",
    "export:mobile": "next export",
    "cap:sync": "cap sync",
    "cap:copy": "cap copy",
    "cap:update": "cap update",
    "cap:ios": "cap open ios",
    "cap:android": "cap open android",
    "mobile:dev": "npm run build:mobile && npm run cap:sync && npm run cap:ios",
    "mobile:build": "npm run build:mobile && npm run cap:sync"
  }
}
```

### Task 1.4: Initialize Capacitor Platforms
```bash
npx cap add ios
npx cap add android
```
- Configure `capacitor.config.ts` with correct webDir:
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.danieldai.aiagent',
  appName: 'AI Agent',
  webDir: 'out',  // ⚠️ CRITICAL: Must point to Next.js static export output
  server: {
    androidScheme: 'https',
  },
};

export default config;
```

---

## Phase 1.5: Backend API Deployment Strategy

### Task 1.5.1: Choose Backend Deployment Option
Evaluate and select one option:
- **Option A**: Vercel Serverless Functions (recommended - easiest)
- **Option B**: AWS Lambda + API Gateway
- **Option C**: Standalone Node.js server (Railway, Render, Fly.io)
- **Option D**: Docker container deployment

Document decision and reasoning.

### Task 1.5.2: Extract API Logic
- Create standalone API project structure (if needed)
- Extract OpenSearch connection logic
- Extract memory management endpoints
- Extract chat API logic
- Set up shared types between mobile and backend
- Create API documentation (endpoints, auth, request/response formats)

### Task 1.5.3: Deploy Backend
- Set up CI/CD for backend
- Configure environment variables on hosting platform:
  - `OPENSEARCH_URL`
  - `OPENAI_API_KEY`
  - Database credentials
- Test all endpoints remotely
- Set up proper CORS configuration for mobile app domains
- Document base URL for mobile app configuration

---

## Phase 2: API & Backend Adaptation

### Task 2.1: API Route Strategy
Since Capacitor apps are static, handle existing API routes:
- Deploy API routes to selected platform (from Phase 1.5)
- Update all API endpoint URLs in the app to point to remote endpoints
- Create API client utility with base URL configuration

### Task 2.2: Environment Configuration (Enhanced)
Create environment files:

**.env.local** (local development):
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_OPENSEARCH_URL=http://localhost:9200
NEXT_PUBLIC_ENV=development
```

**.env.production** (production builds):
```
NEXT_PUBLIC_API_URL=https://your-backend-api.com
NEXT_PUBLIC_OPENSEARCH_URL=https://your-opensearch.com
NEXT_PUBLIC_ENV=production
```

**Important rules:**
- Use `NEXT_PUBLIC_` prefix for client-side variables
- Set up `NEXT_PUBLIC_API_URL` for backend endpoints
- Configure `NEXT_PUBLIC_OPENSEARCH_URL` if needed client-side
- Add environment detection: `process.env.NODE_ENV`
- Use Capacitor Preferences for runtime config storage

### Task 2.3: Update API Calls
- Create centralized API client (`lib/api-client.ts`)
- Update all `fetch` calls to use absolute URLs from env vars
- Implement proper error handling for network failures
- Add retry logic for failed requests
- Add request/response interceptors for auth tokens
- Implement timeout handling

---

## Phase 3: Mobile-Specific Features & Plugins

### Task 3.1: Install Essential Capacitor Plugins
```bash
npm install @capacitor/app @capacitor/status-bar @capacitor/splash-screen @capacitor/keyboard @capacitor/network @capacitor/preferences
```

**Configure each plugin:**
- `@capacitor/app`: App lifecycle and URL handling
- `@capacitor/status-bar`: Status bar styling
- `@capacitor/splash-screen`: Splash screen management
- `@capacitor/keyboard`: Keyboard behavior control
- `@capacitor/network`: Network status monitoring
- `@capacitor/preferences`: Local key-value storage

Add plugin configuration to `capacitor.config.ts`:
```typescript
plugins: {
  SplashScreen: {
    launchShowDuration: 2000,
    backgroundColor: "#ffffff",
    showSpinner: true,
  },
  StatusBar: {
    style: 'dark',
  },
}
```

Add TypeScript types for plugins in `src/types/capacitor.d.ts`

### Task 3.2: Implement Native Features
- Add splash screen assets (iOS: Assets.xcassets, Android: res/drawable)
- Configure app icons for both platforms (1024x1024 source)
- Set up status bar styling (light/dark mode support)
- Implement keyboard handling for forms and chat input
- Test each plugin on both platforms

### Task 3.3: Storage & Security
- Install and configure `@capacitor/preferences` for local storage
- Implement secure storage for user sessions and auth tokens
- Add biometric authentication (`@capacitor/biometrics`) for session resumption
- Implement token refresh mechanism
- Use HTTPS only for all API calls

### Task 3.4: Optional Enhanced Features
Consider installing:
- `@capacitor/camera`: Camera access for future features
- `@capacitor/push-notifications`: Push notification support
- `@capacitor/share`: Native share functionality
- `@capacitor/haptics`: Haptic feedback for interactions
- `@capacitor-community/sqlite`: Local database for offline data

---

## Phase 3.5: Offline & Data Sync Strategy

### Task 3.5.1: Local Cache Implementation
- Use Capacitor Preferences for small data (settings, tokens)
- Consider SQLite for local database (`@capacitor-community/sqlite`)
- Implement cache-first strategy for memories:
  - Check local cache first
  - Fetch from API if not cached or stale
  - Update cache with fresh data
- Add timestamp tracking for cache invalidation

### Task 3.5.2: Network Detection
- Use `@capacitor/network` to detect connectivity changes
- Implement retry queue for failed requests
- Show offline indicator in UI (banner or icon)
- Cache chat history locally for offline viewing
- Handle graceful degradation when offline

### Task 3.5.3: Background Sync
- Implement background data sync when app comes online
- Handle conflict resolution (last-write-wins or merge strategies)
- Add sync status indicators (syncing, synced, error)
- Queue user actions when offline and replay when online
- Add manual sync trigger for users

---

## Phase 3.6: Security Implementation

### Task 3.6.1: Secure Token Storage
- Implement secure token storage using `@capacitor/preferences`
- Never store sensitive data in localStorage or plain preferences
- Use encrypted storage for tokens and credentials

### Task 3.6.2: API Security
- Add request interceptors for auth headers
- Implement token refresh mechanism (before expiry)
- Handle 401/403 responses with re-authentication
- Use HTTPS only for all API calls
- Add certificate pinning for production (optional, advanced)

### Task 3.6.3: Biometric Authentication
- Implement biometric auth (`@capacitor/biometrics`) for:
  - App launch (optional, user preference)
  - Session resumption after background
  - Sensitive actions (e.g., deleting all memories)
- Fallback to PIN/password if biometric unavailable

---

## Phase 4: UI/UX Optimization for Mobile

### Task 4.1: Responsive Design Improvements
- Review and optimize all components for mobile viewport (320px - 428px)
- Ensure proper touch targets (minimum 44x44px for iOS, 48x48dp for Android)
- Test and fix any layout issues on small screens
- Verify horizontal scrolling is intentional only
- Test landscape orientation support

### Task 4.2: Mobile-Specific UI Components
- Update MemoryViewer component for mobile interaction:
  - Swipe gestures for navigation
  - Bottom sheets instead of modals
  - Touch-friendly list items
- Optimize chat interface for mobile screens:
  - Fixed input at bottom
  - Proper keyboard handling
  - Auto-scroll to latest message
- Add pull-to-refresh functionality for memory list
- Implement mobile-friendly navigation (bottom tab bar or hamburger menu)
- Add haptic feedback for key interactions

### Task 4.3: Performance Optimization
- Implement lazy loading for components (React.lazy + Suspense)
- Optimize bundle size:
  - Analyze with `next-bundle-analyzer`
  - Remove unused dependencies
  - Use dynamic imports for large libraries
- Add loading states and skeleton screens
- Optimize images and assets:
  - Use WebP format
  - Implement proper image sizing
  - Lazy load images below fold
- Implement virtualized lists for long memory lists

### Task 4.4: Safe Area Handling
- Add safe area insets for iOS notch/Dynamic Island:
  ```css
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  ```
- Configure viewport meta tags properly in layout:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
  ```
- Handle Android system bars (status bar, navigation bar)
- Test on devices with different notch/punch-hole configurations

---

## Phase 5: Platform-Specific Configuration

### Task 5.1: iOS Configuration
**Info.plist permissions** (ios/App/App/Info.plist):
```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access for capturing images</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access for selecting images</string>
<key>NSMicrophoneUsageDescription</key>
<string>We need microphone access for voice input</string>
```

- Set up app icons and launch screens in Assets.xcassets
- Configure build settings in Xcode:
  - Bundle ID: `com.danieldai.aiagent`
  - Version and build numbers
  - Signing & capabilities
- Add required privacy descriptions
- Configure App Transport Security if needed
- Set deployment target (iOS 13.0+)

### Task 5.2: Android Configuration
**AndroidManifest.xml** (android/app/src/main/AndroidManifest.xml):
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CAMERA" />
```

- Set up app icons (adaptive icons) in res/mipmap
- Configure splash screen in res/drawable
- Set up signing configuration for release builds:
  - Generate keystore
  - Configure gradle signing config
- Set minSdkVersion (24+) and targetSdkVersion (34+)
- Configure ProGuard/R8 rules for release

### Task 5.3: App Metadata & Deep Linking (Enhanced)
**Basic metadata:**
- Set app name, version, and build numbers
- Configure app description and category
- Set up app permissions and capabilities

**Deep linking configuration:**
- Configure custom URL scheme (aiagent://)
- Set up universal links for iOS:
  - Create apple-app-site-association file
  - Host on your domain
  - Add associated domains in Xcode
- Set up app links for Android:
  - Create assetlinks.json file
  - Host on your domain
  - Add intent filters in AndroidManifest
- Implement deep link routing in app
- Test deep link handling from notifications/emails/SMS

---

## Phase 6: Testing & Debugging

### Task 6.1: Development Testing
- Test app on iOS simulator (multiple device types)
- Test app on Android emulator (multiple API levels)
- Test app on physical devices:
  - iOS: iPhone 8, iPhone 14 Pro
  - Android: Pixel 6, Samsung Galaxy
- Test on different screen sizes and orientations

### Task 6.2: Feature Testing
- Test all API integrations with remote backend
- Verify OpenSearch memory functionality:
  - Create memory
  - Search memories
  - View memory details
  - Delete memory
- Test user session management:
  - Login/logout
  - Token refresh
  - Session persistence
- Verify chat functionality:
  - Send messages
  - Receive responses
  - View history
- Test offline functionality
- Test network reconnection scenarios

### Task 6.3: Performance Testing (Enhanced)
**Target metrics:**
- App launch time: < 2 seconds (cold start)
- Time to interactive: < 3 seconds
- Memory usage: < 150MB baseline
- Bundle size: < 5MB initial load
- API response handling: < 100ms overhead
- Smooth scrolling: 60fps maintained

**Testing scenarios:**
- Test on low-end devices (iPhone 8, Android API 28)
- Test with slow network (3G simulation)
- Test with network interruptions
- Monitor battery usage during extended use (30+ minutes)
- Test app launch from cold start and background
- Monitor memory leaks with long sessions
- Test with airplane mode on/off transitions

### Task 6.4: Debug Setup
- Configure remote debugging for iOS:
  - Enable Web Inspector in Safari
  - Connect device and inspect
- Configure remote debugging for Android:
  - Enable Chrome DevTools
  - Use `chrome://inspect`
- Implement logging for mobile-specific issues:
  - Use Capacitor console API
  - Set up error boundary logging
  - Track navigation and lifecycle events
- Set up crash reporting (Sentry, Bugsnag)

---

## Phase 7: Build & Deployment

### Task 7.1: iOS Build Process
- Open project in Xcode: `npx cap open ios`
- Configure provisioning profiles and certificates in Apple Developer
- Set up bundle ID and team
- Archive the app: Product > Archive
- Validate the archive
- Upload to App Store Connect
- Create App Store listing:
  - Screenshots (6.5", 6.7", 5.5")
  - App description
  - Keywords
  - Privacy policy URL
  - Support URL

### Task 7.2: Android Build Process
- Open project in Android Studio: `npx cap open android`
- Configure app signing in `build.gradle`:
  ```gradle
  signingConfigs {
    release {
      storeFile file("my-release-key.keystore")
      storePassword "password"
      keyAlias "my-key-alias"
      keyPassword "password"
    }
  }
  ```
- Generate signed AAB: Build > Generate Signed Bundle / APK
- Test the signed build on device
- Prepare for Google Play submission
- Create Play Store listing:
  - Screenshots (phone, tablet, 7", 10")
  - Feature graphic (1024x500)
  - App description
  - Privacy policy
  - Content rating

### Task 7.3: CI/CD Setup (Optional but Recommended)
- Set up automated builds:
  - GitHub Actions / GitLab CI
  - Build on every commit to main
- Configure Fastlane for iOS:
  - Match for code signing
  - Automated TestFlight uploads
- Configure Gradle for Android:
  - Automated Play Store uploads
- Implement automated testing:
  - Unit tests
  - Integration tests
  - E2E tests with Detox/Appium

### Task 7.4: App Store Pre-Submission Checklist

**iOS Checklist:**
- [ ] App icons all sizes (1024x1024 App Store, plus all device sizes)
- [ ] Launch screen configured and tested
- [ ] Privacy policy URL (required)
- [ ] App Store description & screenshots (all required sizes)
- [ ] TestFlight beta testing completed with 5+ testers
- [ ] All Info.plist permissions with clear descriptions
- [ ] Disable ATS (App Transport Security) if using HTTP (not recommended)
- [ ] Remove all debug/test code and console.logs
- [ ] Test in-app purchases if applicable
- [ ] Verify app works without network connection (graceful handling)
- [ ] Test on oldest supported iOS version
- [ ] Privacy nutrition label completed in App Store Connect

**Android Checklist:**
- [ ] App icons (adaptive + legacy) all densities
- [ ] Feature graphic (1024x500)
- [ ] Screenshots for all device types (phone, 7", 10" tablet)
- [ ] Privacy policy linked in Play Console
- [ ] Content rating questionnaire completed
- [ ] Target API level compliance (targetSdk 34+ for new apps)
- [ ] ProGuard/R8 configuration for release tested
- [ ] Remove debug/test code and console.logs
- [ ] Test signed release build thoroughly
- [ ] Verify app works without network (graceful handling)
- [ ] Test on oldest supported Android version (API 24+)
- [ ] Data safety form completed in Play Console

---

## Phase 8: Post-Launch

### Task 8.1: Monitoring & Analytics
- Implement error tracking (Sentry, Bugsnag, Firebase Crashlytics)
- Add analytics (Firebase Analytics, Amplitude, Mixpanel):
  - Track screen views
  - Track user actions (create memory, search, chat)
  - Track errors and crashes
- Monitor app performance:
  - Crash-free session rate (target: >99%)
  - ANR (Application Not Responding) rate
  - API response times
- Track user engagement:
  - DAU/MAU
  - Session length
  - Feature usage

### Task 8.2: Maintenance
- Set up update mechanism (over-the-air updates with Capacitor Live Updates)
- Plan for regular updates (every 2-4 weeks)
- Monitor user feedback in app stores
- Address bug reports promptly (critical bugs within 24h)
- Monitor app store reviews and respond
- Keep dependencies updated (security patches)

### Task 8.3: Feature Enhancements
- Gather user feedback through:
  - In-app feedback form
  - App store reviews
  - User surveys
- Plan mobile-specific features:
  - Push notifications for memory reminders
  - Widget support (iOS 14+, Android)
  - Siri/Google Assistant shortcuts
  - Apple Watch / Wear OS companion
- Implement push notifications:
  - Firebase Cloud Messaging setup
  - APNs certificate configuration
  - Notification handling in-app
- Add offline support improvements:
  - Full offline mode
  - Sync conflict resolution UI
  - Offline queue management

---

## Key Files to Modify

1. **next.config.ts**: Add static export configuration with `output: 'export'`
2. **capacitor.config.ts**: Configure with `webDir: 'out'` (not 'public')
3. **package.json**: Add mobile-specific scripts and dependencies
4. **app/components/**: Optimize components for mobile (touch targets, responsive)
5. **app/api/**: Deploy separately to Vercel/AWS/standalone server
6. **lib/api-client.ts**: Create centralized API client with env-based URLs
7. **lib/storage.ts**: Implement Capacitor Preferences wrapper
8. **lib/network.ts**: Implement network status detection and retry logic

---

## Potential Challenges & Solutions

### 1. API Routes (CRITICAL)
**Challenge**: Next.js API routes won't work in static export
**Solution**:
- Deploy API routes separately (Vercel Serverless, AWS Lambda, standalone server)
- Update all API calls to use remote URLs
- Configure CORS properly on backend

### 2. Environment Variables
**Challenge**: Build-time vs runtime variables, different per environment
**Solution**:
- Use `NEXT_PUBLIC_` prefix for client-side variables
- Use Capacitor Preferences for runtime configuration
- Create separate .env files per environment

### 3. CORS Issues
**Challenge**: Mobile app making requests to backend triggers CORS
**Solution**:
- Configure CORS on backend to allow mobile app origins
- Use `androidScheme: 'https'` in Capacitor config
- Test with actual device, not just emulator

### 4. Platform Differences
**Challenge**: iOS vs Android behavior differences (keyboard, status bar, etc.)
**Solution**:
- Use Capacitor's platform detection: `Capacitor.getPlatform()`
- Implement platform-specific code where needed
- Test thoroughly on both platforms

### 5. App Store Requirements
**Challenge**: Meeting Apple/Google guidelines (privacy, permissions, metadata)
**Solution**:
- Follow platform-specific guidelines carefully
- Use pre-submission checklists (Phase 7.4)
- Test with TestFlight/Internal Testing first
- Address review feedback promptly

### 6. Offline Functionality
**Challenge**: App depends on backend APIs, poor offline experience
**Solution**:
- Implement local caching with SQLite or Preferences
- Detect network status and show appropriate UI
- Queue failed requests for retry
- Cache chat history and memories locally

### 7. Performance on Low-End Devices
**Challenge**: App slow on older devices (iPhone 8, Android API 28)
**Solution**:
- Optimize bundle size (code splitting, lazy loading)
- Use virtualized lists for long data sets
- Optimize images (WebP, proper sizing)
- Test on low-end devices regularly
- Monitor performance metrics

---

## Estimated Timeline (Revised)

- **Phase 0**: 1 day (API restoration/deployment) - **CRITICAL BLOCKER**
- **Phase 1-2**: 3-4 days (Setup, config, API integration, testing)
- **Phase 3-3.6**: 4-5 days (Mobile features, plugins, offline support, security)
- **Phase 4**: 3-4 days (UI/UX optimization, responsive design, performance)
- **Phase 5**: 2 days (Platform-specific configuration, icons, permissions)
- **Phase 6**: 3-4 days (Comprehensive testing on devices, performance testing)
- **Phase 7**: 3-4 days (Build process, optimization, submission prep, checklists)
- **Phase 8**: Ongoing (monitoring, maintenance, feature enhancements)

**Total Estimated Time**: 3-4 weeks for initial release (more realistic than 2-3 weeks)

**Buffer**: Add 1 week for unexpected issues, app review delays, or additional polish

---

## Success Criteria

- ✅ App successfully builds for iOS and Android
- ✅ All core features work on mobile devices (create, search, view, delete memories)
- ✅ API integration functions correctly with remote backend
- ✅ Memory management and chat features operational
- ✅ Offline functionality works (cache, network detection, sync)
- ✅ Security implemented (secure storage, auth, biometrics)
- ✅ App passes platform-specific review guidelines
- ✅ Performance meets mobile standards:
  - Launch time < 2s
  - Time to interactive < 3s
  - Memory usage < 150MB
  - 60fps scrolling
- ✅ UI is optimized for mobile screen sizes (320px - 428px)
- ✅ Safe area handling works on all devices
- ✅ No critical bugs in production
- ✅ Crash-free session rate > 99%
- ✅ 4.0+ star rating maintained on app stores

---

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Design Guidelines](https://developer.android.com/design)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy](https://play.google.com/about/developer-content-policy/)
- [Fastlane Documentation](https://docs.fastlane.tools/)

---

## Next Steps

1. **Immediately address Phase 0** - Restore/deploy API backend (BLOCKER)
2. **Fix capacitor.config.ts** - Change `webDir: 'public'` to `webDir: 'out'`
3. **Update next.config.ts** - Add `output: 'export'` configuration
4. **Add mobile build scripts** to package.json
5. **Test static export** - Run `npm run build` and verify output
6. **Choose backend deployment platform** - Vercel (recommended), AWS, or standalone
7. **Begin Phase 1** - Full Capacitor setup once backend is deployed

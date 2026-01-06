# U'llai Version History

## Version 1.1.1 (2026-01-06)
### Fixed
- 🔧 **Automatic Username Generation**: Fixed database trigger to create usernames on signup
- 🛡️ **RLS Policy Fix**: Added SECURITY DEFINER to bypass Row Level Security during user creation
- 🔄 **Trigger Consolidation**: Combined user_profile and user_progress triggers to avoid conflicts
- 🔐 **Account Deletion**: Fixed authStore.logout() -> authStore.signOut() in Settings
- 🎯 **Fallback System**: Added RPC function as backup if trigger doesn't fire
- ✅ **Error Handling**: Improved error handling that doesn't block user signup
- 📝 **Signup Message**: Updated to "Please login" instead of email confirmation prompt

---

## Version 1.1.0 (2026-01-06)
### Added
- 🏆 **Leaderboard System**: Competitive rankings with total sentences, accuracy, and streak filters
- 👤 **User Profiles**: Auto-generated creative usernames (e.g., "SwiftSpeaker2043") and customizable avatars
- 🎨 **12 Avatar Options**: Colorful gradient-based profile pictures with emoji icons
- ⚙️ **Profile Management**: Edit username and avatar from Settings page
- 🍪 **Cookie Consent Banner**: GDPR-compliant essential cookies notice
- 🔒 **Privacy Controls**: Toggle to opt-out of leaderboard visibility
- 📋 **GDPR Information**: Detailed data processing transparency in Settings
- 🔗 **Navbar Profile**: Display username and avatar with click-to-settings navigation
- 📊 **User Progress Tracking**: Database integration for leaderboard rankings

### Changed
- 🎯 **Settings Page**: Added privacy section with GDPR compliance details
- 🗄️ **Database Schema**: New user_profiles table with username/avatar columns
- 🔐 **Privacy by Default**: Users appear in leaderboard by default (can opt-out)
- 📱 **Responsive Design**: Mobile-friendly cookie banner and privacy controls

### Fixed
- ✅ Migration idempotency with DROP IF EXISTS statements
- ✅ Client-side join for user_progress and user_profiles tables
- ✅ Show all users in leaderboard including zero-progress users
- ✅ Settings navigation from all pages

---

## Version 1.0.0 (Initial Release)
### Features
- 🎤 **Daily Practice Sessions**: Get a new sentence to practice every day
- 🎙️ **Voice Recording**: Browser-based speech recognition
- 📈 **Progress Tracking**: Monitor accuracy scores and improvement
- 🤖 **AI Feedback**: Optional Gemini AI integration with user's API key
- 📊 **Stats Dashboard**: Visualize practice history and achievements
- 🔐 **Secure Authentication**: Supabase Auth with email/password
- 🔑 **Encrypted API Keys**: AES-256 encryption for user API keys
- ⚙️ **Settings Management**: Dedicated settings page for API keys and account
- 🌐 **Responsive Design**: Mobile-first approach with gradient UI
- 🗃️ **Data Management**: Reset practice data or delete account
- 📧 **Password Reset**: Email-based password recovery

---

## How to Update Version

When making changes, update the version in [package.json](package.json):
- **Major (X.0.0)**: Breaking changes, major new features
- **Minor (1.X.0)**: New features, non-breaking changes
- **Patch (1.0.X)**: Bug fixes, minor improvements

The version automatically displays on the [About page](src/views/AboutView.vue).

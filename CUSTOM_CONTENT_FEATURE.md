# Custom Content Feature

## Overview
Users can now upload or type their own content to practice with, in addition to using the daily generated sentences.

## Features

### 1. **Mode Toggle**
- Switch between "Daily Sentences" and "My Content" modes
- Daily mode provides AI-generated sentences for practice
- Custom mode allows users to practice with their own content

### 2. **Create Custom Content**
- **Type directly**: Enter text manually in a textarea
- **Upload files**: Support for .txt, .doc, and .docx files
- **Drag & drop**: Drag files directly into the upload area
- **Categorize**: Assign categories (Custom, Presentation, Meeting, Speech, Conversation, Reading)
- **Add titles**: Optional titles for better organization

### 3. **Manage Custom Content**
- View all saved custom content
- Mark content as favorite (⭐)
- Delete unwanted content
- Quick preview of content text
- See creation date and category

### 4. **Practice with Custom Content**
- All practice features work the same as daily sentences:
  - Listen to text-to-speech
  - Record your speech
  - Get accuracy scores
  - Receive AI feedback (if API key is configured)
  - Track practice sessions

## Database Schema

### New Table: `custom_content`
```sql
- id (UUID): Primary key
- user_id (UUID): References auth.users
- content (TEXT): The custom text content
- title (TEXT): Optional title
- category (TEXT): Category classification
- difficulty_level (TEXT): Difficulty level (default: 'medium')
- is_favorite (BOOLEAN): Favorite flag
- created_at (TIMESTAMP): Creation timestamp
- updated_at (TIMESTAMP): Last update timestamp
```

### Updated Table: `practice_sessions`
```sql
- Added: custom_content_id (UUID): References custom_content
- Modified: sentence_id is now nullable
- Constraint: Either sentence_id OR custom_content_id must be present
```

## Usage

### For Users:
1. Navigate to the Practice page
2. Click "📝 My Content" toggle button
3. Click "+ Add or Choose Content"
4. Either:
   - Type your content and click "Save & Practice"
   - Upload a text file
5. Practice with the content just like daily sentences

### For Developers:
The feature is implemented across:
- **Database**: Migration file `20260107000100_create_custom_content_table.sql`
- **Store**: Methods added to `src/stores/practice.js`
- **Component**: New `CustomContentModal.vue` component
- **View**: Updated `PracticeView.vue` with mode switching

## API Methods

### Practice Store Methods:
- `createCustomContent(content, title, category)`: Save new custom content
- `fetchCustomContent()`: Get all user's custom content
- `deleteCustomContent(id)`: Delete custom content
- `updateCustomContent(id, updates)`: Update custom content
- `toggleFavoriteCustomContent(id)`: Toggle favorite status
- `setCurrentCustomContent(content)`: Set active content for practice
- `clearCurrentCustomContent()`: Clear active custom content

## Migration

To apply the database migration:

### Local Development:
```bash
npx supabase db reset --local
```

### Production:
```bash
npx supabase db push
```

Or apply through Supabase Dashboard → SQL Editor

## Security

- Row Level Security (RLS) policies ensure users can only:
  - View their own custom content
  - Create content for themselves
  - Update only their own content
  - Delete only their own content
- All custom content is user-scoped via `user_id` foreign key

## File Upload Support

Supported file types:
- `.txt` - Plain text files
- `.doc` - Microsoft Word (older format)
- `.docx` - Microsoft Word (newer format)

Note: Files are read client-side and converted to text before storing in the database.

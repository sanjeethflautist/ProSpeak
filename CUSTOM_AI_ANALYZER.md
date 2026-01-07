# Custom AI Analyzer

## Overview
The AI analyzer has been enhanced to provide context-appropriate feedback based on the type of content being practiced, moving beyond the original business communication focus.

## Features

### 1. **Adaptive Analysis**
The AI analyzer now adapts its feedback based on:
- **Content Type**: Business or Custom
- **Content Category**: Presentation, Meeting, Speech, Conversation, Reading, or General

### 2. **Content-Specific Feedback**

#### **Business Communication** (Daily Sentences)
- Professional delivery and confidence
- Clear pronunciation of business/technical terms
- Appropriate pacing for professional settings (120-160 WPM ideal)
- Strategic pausing for emphasis
- Authoritative yet accessible tone

#### **Presentation**
- Professional delivery and confidence
- Clear articulation for audience comprehension
- Strategic pausing for emphasis and engagement
- Pacing that maintains audience attention
- Authoritative but approachable tone

#### **Meeting**
- Natural conversational flow
- Clear communication without being overly formal
- Appropriate pacing for discussion
- Professional but accessible tone
- Key points articulated with clarity

#### **Formal Speech**
- Compelling delivery with emotional resonance
- Clear enunciation for larger audiences
- Dramatic pausing for effect
- Varied pacing to maintain engagement
- Confident, inspiring tone

#### **Conversation**
- Natural, relaxed delivery
- Conversational pacing (comfortable, not rushed)
- Authentic tone without over-formality
- Clear pronunciation while maintaining naturalness
- Engaging, friendly delivery

#### **Reading/Narration**
- Consistent, clear enunciation
- Appropriate pacing for comprehension
- Expression that brings the text to life
- Smooth flow without stumbling
- Engaging tone that maintains listener interest

#### **General Custom Content**
- Overall clarity and comprehension
- Natural delivery appropriate to the content
- Consistent pacing
- Clear pronunciation of key terms
- Confident, authentic expression

### 3. **Consistent Scoring Framework**
All content types receive scores (0-100) based on:
- Word accuracy (substitutions, omissions, additions)
- Pronunciation clarity
- Speaking pace (measured WPM when audio available)
- Delivery quality appropriate to the content type
- Overall effectiveness

### 4. **Structured Feedback**
Every analysis provides 4-5 sentences covering:
1. **ACCURACY**: Specific word errors with examples
2. **PRONUNCIATION**: 2-3 key words needing clearer pronunciation
3. **PACE & DELIVERY**: Speaking speed and rhythm appropriate to content type
4. **STRENGTHS**: One positive aspect to reinforce
5. **ACTION ITEM**: One specific tip for immediate improvement

## Technical Implementation

### Frontend Changes

#### **speech.js**
```javascript
analyzeVoiceWithAI(spokenText, originalText, audioBlob, contentType, category)
```

New parameters:
- `contentType`: 'business' or 'custom'
- `category`: 'presentation', 'meeting', 'speech', 'conversation', 'reading', or null

#### **PracticeView.vue**
Automatically determines content type and category:
```javascript
const contentType = practiceMode.value === 'daily' ? 'business' : 'custom'
const contentCategory = practiceMode.value === 'custom' ? sentence.value.category : null
```

### Backend Changes

#### **analyze-speech/index.ts**

**New Function**: `generateAnalysisPrompt()`
- Generates context-appropriate prompts based on content type and category
- Provides specific guidance for each content category
- Maintains consistent output format across all types

**Updated Request Handling**:
- Accepts `contentType` and `category` parameters
- Increased character limit from 1000 to 5000 to support longer custom content
- Passes content context to prompt generator

### Prompt Engineering

The AI prompt is dynamically generated with three components:

1. **Base Instruction**: Common to all analyses
   - Original text vs spoken text comparison
   - Audio analysis (WPM, duration)

2. **Contextual Guidance**: Specific to content type/category
   - Focus areas appropriate to the context
   - Expectations for delivery style
   - Relevant assessment criteria

3. **Output Format**: Consistent structure
   - Score (0-100)
   - Structured feedback in 5 parts

## Usage

### For Users
The system automatically adapts based on your practice mode:

**Daily Sentences:**
- AI provides business communication feedback
- Focus on professional delivery

**Custom Content:**
- AI adapts to your selected category
- Feedback matches the content type (presentation, meeting, etc.)
- More appropriate guidance for your specific practice goal

### For Developers

To call the enhanced analyzer:

```javascript
import { analyzeVoiceWithAI } from './lib/speech'

const result = await analyzeVoiceWithAI(
  spokenText,
  originalText,
  audioBlob,
  'custom',           // contentType: 'business' or 'custom'
  'presentation'      // category: specific category or null
)

// result = { analysis: string, aiScore: number }
```

## Benefits

1. **More Relevant Feedback**: Users get advice tailored to their practice goals
2. **Better Learning**: Context-appropriate guidance helps improve specific skills
3. **Flexibility**: Supports various communication scenarios beyond business
4. **Consistency**: Maintains structured format across all content types
5. **Scalability**: Easy to add new content categories in the future

## Future Enhancements

Potential additions:
- **Interview Practice**: Focus on answering techniques and clarity
- **Storytelling**: Emphasis on narrative flow and engagement
- **Technical Explanation**: Clear communication of complex topics
- **Sales Pitch**: Persuasion and confidence metrics
- **Debate**: Argumentation and rebuttal clarity

## Migration Notes

- No database changes required
- Backward compatible with existing practice sessions
- Default behavior: If no content type specified, uses 'business' mode
- Existing daily sentences continue to work with business communication analysis

## API Changes

### Request Body (analyze-speech function)
```typescript
{
  spokenText: string,
  originalText: string,
  audioBase64: string,
  mimeType: string,
  contentType?: string,    // NEW: 'business' | 'custom' (default: 'business')
  category?: string | null // NEW: specific category (default: null)
}
```

### Response
```typescript
{
  analysis: string,  // Structured feedback text
  aiScore: number    // Score 0-100
}
```

No breaking changes - all new fields are optional with sensible defaults.

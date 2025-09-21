# Voice Analysis Integration Execution Plan

## Overview

Integrate spinbot-inspired voice analysis capabilities into the biography generation system to create more authentic, personalized professional biographies that capture the individual's unique communication style and professional persona.

## Inspiration Source

Based on analysis of `/Users/jacobwilliams/Atomic/ai-examples/spinbot/` which demonstrates sophisticated author voice analysis through:

- Individual post style extraction with detailed rhetorical analysis
- Temporal style evolution tracking
- Comprehensive voice signature synthesis

## Implementation Strategy: Leverage Existing Spinbot + Simple Integration

### Step 1: Copy Spinbot Into Our Repo

**What we'll do**: Copy spinbot's analysis functions directly into our codebase

**Integration approach:**

1. Copy `analyzeAuthorStyle.ts` from spinbot into `lib/voiceAnalysis.ts`
2. Modify it to return the analysis result instead of just logging it
3. Use that result directly in our bio generation prompt

**Simple workflow:**

- Run spinbot analysis on writing samples → get voice analysis
- Cache the analysis result
- Include voice analysis in bio generation prompt
- No external dependencies or complex integrations needed

### Step 2: Simple Caching

**File**: `lib/voiceCache.ts`

**Functions:**

- `saveVoiceContext(authorName: string, context: string): Promise<void>` // Cache spinbot response
- `loadVoiceContext(authorName: string): Promise<string | null>` // Load cached response
- `shouldRefreshCache(authorName: string): boolean` // > 3 months = auto refresh

**Cache Structure:** Just save the raw spinbot response with timestamp

```json
{
	"authorName": "Jacob Williams",
	"spinbotResponse": "/* raw spinbot analysis text */",
	"lastUpdated": "2024-01-15T10:30:00Z"
}
```

### Step 3: CLI Integration

**File**: `generateBio.ts` (minimal changes)

**New CLI Options:**

- `--analyze-voice`: Force voice analysis even if cached
- `--voice-sources <path>`: Specify directory containing writing samples
- `--skip-voice`: Generate bio without voice analysis

**Workflow Enhancement:**

```
1. Check for cached voice signature
2. If not cached or --analyze-voice flag:
   a. Discover writing samples from --voice-sources or default locations
   b. Run voice analysis (show progress)
   c. Cache result
3. Load voice signature into bio generation context
4. Generate enhanced bio with voice signature (existing streaming)
```

### Phase 4: Writing Sample Discovery

**File**: `tools/discoverWritingSamples.ts`

**Sample Sources:**

- Blog posts (markdown files with frontmatter)
- Technical documentation (README files, docs/ directories)
- Presentation content (if available)
- Code comments and commit messages (git history analysis)

**Auto-discovery Logic:**

- Scan common blog/content directories
- Parse git history for authored commits
- Extract documentation authored by the individual
- Identify presentation materials

## Technical Implementation Details

### Voice Analysis Process

1. **Individual Sample Analysis**: Each writing sample analyzed for style characteristics using GPT-4o-mini
2. **Synthesis**: All individual analyses combined using GPT-4o to create comprehensive voice signature
3. **Validation**: Ensure voice signature contains all required fields and reasonable values

### Bio Generation Enhancement

- Existing bio prompt enhanced with voice signature section
- Voice characteristics integrated into personal frame
- Authentic communication patterns reflected in bio tone and structure

### Error Handling

- Graceful degradation if voice analysis fails
- Fallback to standard bio generation without voice enhancement
- Clear error messages for missing or invalid writing samples

### Cache Invalidation Strategy

**Simple Two-Rule System:**

1. **Auto-refresh**: Cache older than 3 months automatically refreshes
2. **User choice**: If cache exists and is < 3 months old, ask user if they want to refresh

**User Interaction:**

```bash
# Cache exists and is recent
bun run generateBio.ts "Jacob Williams"
> 📋 Found cached voice signature from 6 weeks ago. Use cached version or refresh? (use/Refresh)

# Cache is old - auto refresh
bun run generateBio.ts "Jacob Williams"
> 🔄 Voice signature is 4 months old, refreshing automatically...

# Force refresh regardless
bun run generateBio.ts "Jacob Williams" --refresh-voice
> 🔄 Refreshing voice signature...
```

### Performance Considerations

- Cache voice signatures to avoid re-analysis
- Rate limiting for API calls during voice analysis
- Parallel processing of multiple writing samples where possible
- Incremental analysis for new content (append to existing signature)

## User Experience Flow

### First-Time Usage

```bash
bun run generateBio.ts "Jacob Williams" --analyze-voice --voice-sources ./blog-posts/
```

1. "🔍 Discovering writing samples..."
2. "📝 Analyzing communication style from 15 samples..."
3. "💾 Caching voice signature for future use..."
4. "✨ Generating biography with authentic voice..."
5. Stream bio generation as normal

### Subsequent Usage

```bash
bun run generateBio.ts "Jacob Williams"
```

1. "📋 Loading cached voice signature..."
2. "✨ Generating biography with authentic voice..."
3. Stream bio generation as normal

### Voice Re-analysis

```bash
bun run generateBio.ts "Jacob Williams" --analyze-voice
```

Forces fresh voice analysis and cache update

## Integration Points with Existing System

### Enhanced Personal Frame

Voice signature data integrated into existing personal frame structure:

- Communication style informs bio tone
- Professional persona enhances value statements
- Rhetorical strategies influence bio structure
- Authenticity markers ensure genuine voice

### Prompt Template Updates

Existing bio generation prompt enhanced with voice signature section that provides:

- Communication style guidelines
- Rhetorical preferences
- Professional persona indicators
- Audience targeting insights

### Configuration Integration

Voice analysis settings added to existing AI configuration system:

- Model selection for voice analysis
- Caching preferences
- Default voice source directories

## Success Metrics

### Quality Indicators

- Biographies feel more authentic and personalized
- Voice characteristics clearly reflected in generated content
- Consistent communication style across multiple bio generations

### Technical Metrics

- Voice analysis completion rate > 90%
- Cache hit rate for voice signatures > 80%
- Bio generation time increase < 30% when including voice analysis

## Future Enhancements

### Advanced Features

- Multi-modal voice analysis (video transcripts, presentation slides)
- Voice evolution tracking over time
- Audience-specific voice adaptation
- Team voice signature analysis for organizational bios

### Integration Opportunities

- Export voice signatures for other content generation tools
- Voice consistency checking for existing content
- Automated writing style recommendations

## Dependencies

### New Dependencies

- Enhanced AI SDK usage for voice analysis
- File system operations for caching
- Writing sample parsing utilities

### Existing Dependencies

- Current AI configuration system
- Streaming response handling
- CLI argument parsing

## Implementation Timeline

### Phase 1: Core Voice Analysis (Week 1)

- Implement voice analysis module
- Create voice signature types
- Build sample analysis prompts

### Phase 2: Caching & CLI Integration (Week 2)

- Implement caching system
- Integrate with existing CLI
- Add voice analysis workflow

### Phase 3: Sample Discovery & Enhancement (Week 3)

- Build writing sample discovery tools
- Enhance bio generation prompts
- Implement error handling

### Phase 4: Testing & Refinement (Week 4)

- Test with various writing sample types
- Refine voice analysis prompts
- Optimize performance and user experience

## Notes for Implementation

### Key Design Decisions

- Sequential rather than multi-agent approach for simplicity
- Caching to avoid repeated analysis costs
- Optional voice analysis to maintain existing workflow compatibility
- Integration with existing streaming architecture

### Critical Success Factors

- Voice analysis must add clear value to bio quality
- Performance impact must be minimal for cached signatures
- Graceful degradation when voice analysis unavailable
- Clear user feedback during voice analysis process

### Testing Strategy

- Test with diverse writing sample types and quantities
- Validate voice signature consistency across multiple analyses
- Ensure bio quality improvement is measurable
- Test caching and error handling edge cases

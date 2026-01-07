<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ mode === 'create' ? 'Add Custom Content' : 'My Custom Content' }}</h2>
        <button @click="$emit('close')" class="close-btn">✕</button>
      </div>

      <div class="modal-body">
        <!-- Create/Edit Mode -->
        <div v-if="mode === 'create' || mode === 'edit'" class="create-section">
          <div class="input-group">
            <label for="title">Title (Optional)</label>
            <input
              id="title"
              v-model="formData.title"
              type="text"
              placeholder="e.g., My Presentation, Meeting Script"
              maxlength="100"
            />
          </div>

          <div class="input-group">
            <label for="content">Content *</label>
            <textarea
              id="content"
              v-model="formData.content"
              placeholder="Type or paste your text here..."
              rows="8"
              required
            ></textarea>
            <div class="char-count">{{ formData.content.length }} characters</div>
          </div>

          <div class="input-group">
            <label for="category">Category</label>
            <select id="category" v-model="formData.category">
              <option value="custom">Custom</option>
              <option value="presentation">Presentation</option>
              <option value="meeting">Meeting</option>
              <option value="speech">Speech</option>
              <option value="conversation">Conversation</option>
              <option value="reading">Reading</option>
            </select>
          </div>

          <div class="file-upload-section">
            <label>Or Upload a Text File</label>
            <div class="upload-area" @click="triggerFileInput" @drop.prevent="handleFileDrop" @dragover.prevent>
              <input
                ref="fileInput"
                type="file"
                accept=".txt,.doc,.docx"
                @change="handleFileSelect"
                style="display: none"
              />
              <div class="upload-content">
                <span class="upload-icon">📄</span>
                <p>Click to upload or drag & drop</p>
                <p class="upload-hint">Supports: .txt, .doc, .docx</p>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button @click="$emit('close')" class="btn-secondary">Cancel</button>
            <button @click="saveContent" class="btn-primary" :disabled="!formData.content.trim() || saving">
              {{ saving ? 'Saving...' : (mode === 'edit' ? 'Update' : 'Save & Practice') }}
            </button>
          </div>
        </div>

        <!-- List Mode -->
        <div v-else class="list-section">
          <div class="list-header">
            <button @click="mode = 'create'" class="btn-primary">
              <span>+</span> Add New Content
            </button>
          </div>

          <div v-if="loading" class="loading">Loading your content...</div>

          <div v-else-if="contentList.length === 0" class="empty-state">
            <p>📝 No custom content yet</p>
            <p class="empty-hint">Create your first custom content to practice with!</p>
          </div>

          <div v-else class="content-list">
            <div
              v-for="item in contentList"
              :key="item.id"
              class="content-item"
              :class="{ favorite: item.is_favorite }"
            >
              <div class="content-info">
                <h3>{{ item.title || 'Untitled' }}</h3>
                <p class="content-preview">{{ truncateText(item.content, 100) }}</p>
                <div class="content-meta">
                  <span class="category-tag">{{ formatCategory(item.category) }}</span>
                  <span class="date">{{ formatDate(item.created_at) }}</span>
                </div>
              </div>
              <div class="content-actions">
                <button @click="toggleFavorite(item)" class="icon-btn" :title="item.is_favorite ? 'Remove from favorites' : 'Add to favorites'">
                  {{ item.is_favorite ? '⭐' : '☆' }}
                </button>
                <button @click="selectContent(item)" class="btn-practice">Practice</button>
                <button @click="deleteContent(item.id)" class="icon-btn delete-btn" title="Delete">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { usePracticeStore } from '../stores/practice'

const props = defineProps({
  show: Boolean,
  initialMode: {
    type: String,
    default: 'list' // 'list', 'create', 'edit'
  }
})

const emit = defineEmits(['close', 'contentSelected'])

const practiceStore = usePracticeStore()
const mode = ref(props.initialMode)
const loading = ref(false)
const saving = ref(false)
const contentList = ref([])
const fileInput = ref(null)

const formData = ref({
  title: '',
  content: '',
  category: 'custom'
})

watch(() => props.show, async (newVal) => {
  if (newVal) {
    mode.value = props.initialMode
    if (mode.value === 'list') {
      await loadContent()
    }
    resetForm()
  }
})

onMounted(async () => {
  if (props.show && mode.value === 'list') {
    await loadContent()
  }
})

const loadContent = async () => {
  loading.value = true
  try {
    contentList.value = await practiceStore.fetchCustomContent()
  } catch (error) {
    console.error('Error loading custom content:', error)
  } finally {
    loading.value = false
  }
}

const saveContent = async () => {
  if (!formData.value.content.trim()) return

  saving.value = true
  try {
    const newContent = await practiceStore.createCustomContent(
      formData.value.content,
      formData.value.title,
      formData.value.category
    )
    
    // Emit the content to be used immediately
    emit('contentSelected', newContent)
    emit('close')
  } catch (error) {
    console.error('Error saving content:', error)
    alert('Failed to save content. Please try again.')
  } finally {
    saving.value = false
  }
}

const selectContent = (content) => {
  emit('contentSelected', content)
  emit('close')
}

const deleteContent = async (id) => {
  if (!confirm('Are you sure you want to delete this content?')) return

  try {
    await practiceStore.deleteCustomContent(id)
    contentList.value = contentList.value.filter(c => c.id !== id)
  } catch (error) {
    console.error('Error deleting content:', error)
    alert('Failed to delete content. Please try again.')
  }
}

const toggleFavorite = async (item) => {
  try {
    await practiceStore.toggleFavoriteCustomContent(item.id)
    item.is_favorite = !item.is_favorite
  } catch (error) {
    console.error('Error toggling favorite:', error)
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (event) => {
  const file = event.target.files[0]
  if (file) {
    await processFile(file)
  }
}

const handleFileDrop = async (event) => {
  const file = event.dataTransfer.files[0]
  if (file) {
    await processFile(file)
  }
}

const processFile = async (file) => {
  const validTypes = ['text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  
  if (!validTypes.includes(file.type) && !file.name.endsWith('.txt')) {
    alert('Please upload a .txt, .doc, or .docx file')
    return
  }

  try {
    const text = await file.text()
    formData.value.content = text
    if (!formData.value.title) {
      formData.value.title = file.name.replace(/\.[^/.]+$/, '')
    }
  } catch (error) {
    console.error('Error reading file:', error)
    alert('Failed to read file. Please try again.')
  }
}

const resetForm = () => {
  formData.value = {
    title: '',
    content: '',
    category: 'custom'
  }
}

const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const formatCategory = (category) => {
  if (!category) return 'Custom'
  return category.charAt(0).toUpperCase() + category.slice(1)
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #1f2937;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.create-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
}

.input-group input,
.input-group textarea,
.input-group select {
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s;
}

.input-group input:focus,
.input-group textarea:focus,
.input-group select:focus {
  outline: none;
  border-color: #667eea;
}

.input-group textarea {
  resize: vertical;
  min-height: 150px;
}

.char-count {
  font-size: 0.85rem;
  color: #6b7280;
  text-align: right;
}

.file-upload-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-upload-section label {
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #f9fafb;
}

.upload-area:hover {
  border-color: #667eea;
  background: #f3f4f6;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-icon {
  font-size: 2.5rem;
}

.upload-area p {
  margin: 0;
  color: #374151;
  font-size: 0.95rem;
}

.upload-hint {
  font-size: 0.85rem !important;
  color: #6b7280 !important;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 1rem;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.list-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.list-header {
  display: flex;
  justify-content: flex-end;
}

.list-header .btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading {
  text-align: center;
  color: #6b7280;
  padding: 40px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.empty-state p:first-child {
  font-size: 3rem;
  margin: 0 0 16px 0;
}

.empty-hint {
  font-size: 0.95rem;
  margin: 0;
}

.content-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.content-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.2s;
  background: white;
}

.content-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.content-item.favorite {
  border-color: #fbbf24;
  background: #fffbeb;
}

.content-info {
  flex: 1;
  min-width: 0;
}

.content-info h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.content-preview {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.content-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 0.85rem;
}

.category-tag {
  background: #e0e7ff;
  color: #4338ca;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 500;
}

.date {
  color: #9ca3af;
}

.content-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #f3f4f6;
}

.delete-btn:hover {
  background: #fee2e2;
}

.btn-practice {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-practice:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

@media (max-width: 640px) {
  .modal-content {
    max-height: 100vh;
    border-radius: 0;
  }

  .content-item {
    flex-direction: column;
    align-items: stretch;
  }

  .content-actions {
    margin-top: 12px;
    justify-content: space-between;
  }
}
</style>

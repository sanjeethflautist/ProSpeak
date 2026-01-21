<template>
  <div class="maintenance-container">
    <div class="maintenance-card">
      <div class="logo">
        <h1><img src="/ullai-logo.png" alt="U'llai" class="logo-image" /> U'llai</h1>
      </div>
      
      <div class="maintenance-content">
        <div class="icon-container">
          <span class="maintenance-icon">🛠️</span>
        </div>
        
        <h2>!Under Maintenance!</h2>
        <p class="message">Sorry! We are fixing some bugs of Ullai.in</p>
        <p class="sub-message">We will be back soon...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.maintenance-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  padding: 1rem;
}

.maintenance-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  width: 100%;
  max-width: 450px;
  text-align: center;
}

.logo {
  margin-bottom: 2rem;
}

.logo h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2d3748;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 0;
}

.logo-image {
  height: 32px;
  width: auto;
}

.maintenance-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon-container {
  font-size: 3rem;
  margin-bottom: 1.5rem;
  animation: pulse 2s infinite;
}

h2 {
  color: #e53e3e;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.message {
  font-size: 1.125rem;
  color: #4a5568;
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.sub-message {
  color: #718096;
  font-size: 1rem;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
</style>

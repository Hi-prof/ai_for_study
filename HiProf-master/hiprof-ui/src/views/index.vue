<template>
  <div class="app-container home-container">
    <div class="home-title">八闽慧教团队制作</div>
  </div>
</template>

<script>
export default {
  name: "Index"
}
</script>

<style scoped lang="scss">
.home-container {
  min-height: calc(100vh - 140px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: #fff;
}

.home-title {
  color: #303133;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 6px;
  text-align: center;
}
</style>

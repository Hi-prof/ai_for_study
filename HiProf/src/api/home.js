import request from './axios';

// 获取公告列表
export function getAnnouncements() {
  return request({
    url: '/api/announcements',
    method: 'get'
  });
}

// 获取轮播图数据
export function getCarouselData() {
  return request({
    url: '/api/carousel',
    method: 'get'
  });
}

// 获取热门知识图谱
export function getPopularGraphs(params) {
  return request({
    url: '/api/graphs/popular',
    method: 'get',
    params
  });
}

// 获取系统特性
export function getSystemFeatures() {
  return request({
    url: '/api/system/features',
    method: 'get'
  });
}

// 获取演示图谱数据
export function getDemoGraphData() {
  return request({
    url: '/api/graphs/demo',
    method: 'get'
  });
} 
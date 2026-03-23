package com.hiprof.portal.service.imp

import com.hiprof.portal.domain.Banner
import com.hiprof.portal.mapper.HomeMapper
import com.hiprof.portal.service.HomeService
import org.springframework.stereotype.Service

@Service
class HomeServiceImp(
    private val homeMapper: HomeMapper
):HomeService {
    override fun getBannerList(): List<Banner> {
        return homeMapper.getBannerList()
    }


}
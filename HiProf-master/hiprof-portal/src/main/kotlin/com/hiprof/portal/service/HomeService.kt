package com.hiprof.portal.service

import com.hiprof.portal.domain.Banner


interface HomeService {

    fun getBannerList():List<Banner>

}
package com.hiprof.portal.mapper

import com.hiprof.portal.domain.Banner


interface HomeMapper {

    fun getBannerList():List<Banner>

}
package com.hiprof.portal.controller

import com.hiprof.common.core.controller.BaseController
import com.hiprof.common.core.page.TableDataInfo
import com.hiprof.portal.service.HomeService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController




@Tag(name = "首页管理")
@RestController
@RequestMapping("/home")
class HomeController(
    private val homeService: HomeService
): BaseController() {


//    /**
//     * 获取轮播图列表
//     */

    @Operation(summary = "获取轮播图列表")
    @GetMapping("/banner")
    fun getBannerList() :TableDataInfo{
        startPage()
    val bannerList = homeService.getBannerList()
    return getDataTable(bannerList)


}

}
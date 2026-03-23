package com.hiprof.web.controller.common;

import com.aliyun.oss.model.ObjectMetadata;
import com.hiprof.common.core.domain.AjaxResult;
import com.hiprof.common.utils.OssFileUploadUtils;
import com.hiprof.common.utils.StringUtils;
import com.hiprof.core.domain.ClFiles;
import com.hiprof.framework.config.ServerConfig;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import kotlin.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * 通用请求处理
 * 
 * @author ruoyi
 */

@Tag(name="通用接口")
@RestController
@RequestMapping("/common")
public class CommonController
{
    private static final Logger log = LoggerFactory.getLogger(CommonController.class);

    @Autowired
    private ServerConfig serverConfig;
    @Autowired
    private OssFileUploadUtils ossFileUploadUtils;

    private static final String FILE_DELIMETER = ",";

    /**
     * 通用下载请求
     * 
     * @param fileName 文件名称
     * @param delete 是否删除
     */
//    @GetMapping("/download")
//    public void fileDownload(String fileName, Boolean delete, HttpServletResponse response, HttpServletRequest request) {
//        try
//        {
//            if (!FileUtils.checkAllowDownload(fileName))
//            {
//                throw new Exception(StringUtils.format("文件名称({})非法，不允许下载。 ", fileName));
//            }
//            String realFileName = System.currentTimeMillis() + fileName.substring(fileName.indexOf("_") + 1);
//            String filePath = RuoYiConfig.getDownloadPath() + fileName;
//
//            response.setContentType(MediaType.APPLICATION_OCTET_STREAM_VALUE);
//            FileUtils.setAttachmentResponseHeader(response, realFileName);
//            FileUtils.writeBytes(filePath, response.getOutputStream());
//            if (delete)
//            {
//                FileUtils.deleteFile(filePath);
//            }
//        }
//        catch (Exception e)
//        {
//            log.error("下载文件失败", e);
//        }
//    }

    /**
     * 通用上传请求（单个）
     */
    @Operation(summary = "上传文件")
    @PostMapping("/upload")
    public AjaxResult uploadFile(MultipartFile file)
    {
        try {
            Pair<String, ObjectMetadata> stringObjectMetadataPair = ossFileUploadUtils.uploadFile(file);
            String objKey = stringObjectMetadataPair.getFirst();
            ObjectMetadata fileMetadata = stringObjectMetadataPair.getSecond();
            ClFiles clFiles = new ClFiles();
            clFiles.setFileKey(objKey);
            clFiles.setFileSize(fileMetadata.getContentLength());
            clFiles.setFileType(fileMetadata.getContentType());
            clFiles.setFileUrl(ossFileUploadUtils.toFileUrl(objKey));
            return AjaxResult.success("上传成功",clFiles);
        }
        catch (Exception e) {
            return AjaxResult.error(e.getMessage());
        }
    }




    /**
     * 通用上传请求（多个）
     */
    @Operation(summary = "上传多个文件")
    @PostMapping("/uploads")
    public AjaxResult uploadFiles(List<MultipartFile> files) throws Exception {
        try
        {

            if(files.size()>5){
                return AjaxResult.error("上传文件数量不能超过5个");
            }
            List<String> urls = new ArrayList<String>();
            List<String> originalFilenames = new ArrayList<String>();
            for (MultipartFile file : files)
            {
                String objKey = ossFileUploadUtils.uploadFile(file).getFirst();
                urls.add(ossFileUploadUtils.toFileUrl(objKey));
                originalFilenames.add(file.getOriginalFilename());
            }
            AjaxResult ajax = AjaxResult.success();
            ajax.put("urls", StringUtils.join(urls, FILE_DELIMETER));
            ajax.put("originalFilenames", StringUtils.join(originalFilenames, FILE_DELIMETER));
            return ajax;
        }
        catch (Exception e) {
            return AjaxResult.error(e.getMessage());
        }
    }

    /**
     * 本地资源通用下载
     */
//    @GetMapping("/download/resource")
//    public void resourceDownload(String resource, HttpServletRequest request, HttpServletResponse response)
//            throws Exception {
//        try
//        {
//            if (!FileUtils.checkAllowDownload(resource))
//            {
//                throw new Exception(StringUtils.format("资源文件({})非法，不允许下载。 ", resource));
//            }
//            // 本地资源路径
//            String localPath = RuoYiConfig.getProfile();
//            // 数据库资源地址
//            String downloadPath = localPath + StringUtils.substringAfter(resource, Constants.RESOURCE_PREFIX);
//            // 下载名称
//            String downloadName = StringUtils.substringAfterLast(downloadPath, "/");
//            response.setContentType(MediaType.APPLICATION_OCTET_STREAM_VALUE);
//            FileUtils.setAttachmentResponseHeader(response, downloadName);
//            FileUtils.writeBytes(downloadPath, response.getOutputStream());
//        }
//        catch (Exception e)
//        {
//            log.error("下载文件失败", e);
//        }
//    }
}

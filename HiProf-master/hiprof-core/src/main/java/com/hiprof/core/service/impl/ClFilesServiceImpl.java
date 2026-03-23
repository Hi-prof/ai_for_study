package com.hiprof.core.service.impl;

import java.util.List;
import com.hiprof.common.utils.DateUtils;
import com.hiprof.common.utils.OssFileUploadUtils;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.hiprof.core.mapper.ClFilesMapper;
import com.hiprof.core.domain.ClFiles;
import com.hiprof.core.service.IClFilesService;
import org.springframework.transaction.annotation.Transactional;

/**
 * 课程文件Service业务层处理
 * 
 * @author emiya
 * @date 2025-08-07
 */
@Service
public class ClFilesServiceImpl implements IClFilesService 
{
    @Autowired
    private ClFilesMapper clFilesMapper;

    @Autowired
    private OssFileUploadUtils ossFileUploadUtils;

    /**
     * 查询课程文件
     * 
     * @param id 课程文件主键
     * @return 课程文件
     */
    @Override
    public ClFiles selectClFilesById(Long id)
    {
        return clFilesMapper.selectClFilesById(id);
    }

    /**
     * 查询课程文件列表
     * 
     * @param clFiles 课程文件
     * @return 课程文件
     */
    @Override
    public List<ClFiles> selectClFilesList(ClFiles clFiles)
    {
        return clFilesMapper.selectClFilesList(clFiles);
    }

    /**
     * 新增课程文件
     * 
     * @param clFiles 课程文件
     * @return 结果
     */
    @Override
    public int insertClFiles(ClFiles clFiles) {
        clFiles.setCreateTime(DateUtils.getNowDate());
        //校验文件格式
        if (checkFileType(clFiles)) {throw new RuntimeException("实际文件格式与上传字段中的文件格式不同");}
        return clFilesMapper.insertClFiles(clFiles);
    }

    private boolean checkFileType(ClFiles file) {
        try{
            Tika tika = new Tika();
            String detectedFileType = tika.detect(file.getFileUrl());
            String declaredFileType = file.getFileType();
            return !detectedFileType.equals(declaredFileType);
        }catch (Exception e){
            return true;
        }

    }


    /**
     * 修改课程文件
     * 
     * @param clFiles 课程文件
     * @return 结果
     */
    @Override
    public int updateClFiles(ClFiles clFiles)
    {
        clFiles.setUpdateTime(DateUtils.getNowDate());
        if (checkFileType(clFiles)) {throw new RuntimeException("实际文件格式与上传字段中的文件格式不同");}
        return clFilesMapper.updateClFiles(clFiles);
    }

    /**
     * 批量删除课程文件
     * 
     * @param ids 需要删除的课程文件主键
     * @return 结果
     */
    @Override
    @Transactional
    public int deleteClFilesByIds(Long[] ids)
    {
        //先删除OSS中的数据
        List<ClFiles> clFiles = clFilesMapper.selectClFilesListByIds(ids);
        List<String> list = clFiles.stream().map(ClFiles::getFileKey).toList();
        try{
            ossFileUploadUtils.deleteFiles(list);
        }catch (Exception e){
            throw new RuntimeException("删除OSS中的文件失败,删除操作终止");
        }
        return clFilesMapper.deleteClFilesByIds(ids);
    }

    /**
     * 删除课程文件信息
     * 
     * @param id 课程文件主键
     * @return 结果
     */

}

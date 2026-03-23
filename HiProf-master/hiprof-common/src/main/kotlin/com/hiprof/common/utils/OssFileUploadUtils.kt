package com.hiprof.common.utils

import com.aliyun.credentials.Client
import com.aliyun.credentials.models.Config
import com.aliyun.credentials.provider.StaticCredentialsProvider
import com.aliyun.oss.ClientBuilderConfiguration
import com.aliyun.oss.ClientException
import com.aliyun.oss.OSSClientBuilder
import com.aliyun.oss.OSSException
import com.aliyun.oss.common.auth.CredentialsProviderFactory
import com.aliyun.oss.common.auth.EnvironmentVariableCredentialsProvider
import com.aliyun.oss.common.comm.SignVersion
import com.aliyun.oss.model.DeleteObjectsRequest
import com.aliyun.oss.model.ObjectMetadata
import org.springframework.stereotype.Component
import org.springframework.web.multipart.MultipartFile
import java.util.*


@Component
object OssFileUploadUtils {

    private const val endpoint = "oss-cn-fuzhou.aliyuncs.com"
    private const val bucketName = "web-test-bucket"
    private const val region = "cn-fuzhou"
    private const val maxSize = 10*1024*1024  //10MB
    private  val ALLOWED_MIME_TYPES = setOf(
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf",
        "application/x-tar",
        "application/rar",
        "application/zip",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    )

    fun Int.toMB():Double = this /1024.0/1024.0

    // 从环境变量中获取访问凭证。运行本代码示例之前，需要先配置环境变量
    private val   credentialsProvider: EnvironmentVariableCredentialsProvider by lazy {
        CredentialsProviderFactory.newEnvironmentVariableCredentialsProvider()


    }
    fun deleteFiles(fileKeys: List<String>) {
        // 创建 OSS 客户端配置
        val clientBuilderConfiguration = ClientBuilderConfiguration().also {
            it.signatureVersion = SignVersion.V4
            // 可以根据需要配置连接超时、最大连接数等参数
// ossConfig.connectionTimeout = 5000
// ossConfig.maxConnections = 1024
        }
        //通过credentialsProvider创建连接实例,不使用时需要及时释放
        val oss = OSSClientBuilder.create()
            .endpoint(endpoint)
            .credentialsProvider(credentialsProvider)
            .clientConfiguration(clientBuilderConfiguration)
            .region(region)
            .build()
        val deleteObjectsRequest = DeleteObjectsRequest(bucketName).also {
            it.keys = fileKeys
        }
        try {
            oss.deleteObjects(deleteObjectsRequest)
        } catch (e: OSSException) {
            println("Caught an OSSException, which means your request made it to OSS, "
                    + "but was rejected with an error response for some reason.")
            println("Error Message:" + e.errorMessage)
            println()
        }finally {
            oss.shutdown()
        }
    }

    fun toFileUrl(objKey: String): String = "https://${bucketName}.${endpoint}/" +objKey

    fun uploadFile(file: MultipartFile): Pair<String,ObjectMetadata>? {
        //文件大小限制
        if (file.size > maxSize) throw IllegalArgumentException("文件大小不能超过 ${maxSize.toMB()}")

        val clientBuilderConfiguration = ClientBuilderConfiguration().also {
            it.signatureVersion = SignVersion.V4
        }
        //通过credentialsProvider创建连接实例,不使用时需要及时释放
        val oss = OSSClientBuilder.create()
            .endpoint(endpoint)
            .credentialsProvider(credentialsProvider)
            .clientConfiguration(clientBuilderConfiguration)
            .region(region)
            .build()

        try {
            file.inputStream.use {

                val contentType = file.contentType
                val originalFilename = file.originalFilename ?: throw IllegalArgumentException("文件名不能为空")
                if (contentType == null) throw IllegalArgumentException("文件类型不能为空")
                if (!ALLOWED_MIME_TYPES.contains(contentType)) throw IllegalArgumentException("不受支持的文件格式:${ contentType}")
                if (originalFilename.length > 255) throw IllegalArgumentException("文件名不能超过255个字符")
                val indexOf = originalFilename.lastIndexOf(".")
                val objKey = "hiprof/" + UUID.randomUUID().toString() + originalFilename.substring(indexOf)
                val metadata = ObjectMetadata()
                metadata.contentLength = it.available().toLong()
                oss.putObject(bucketName, objKey, it, metadata)
                //获取上传文件元数据
                val objectMetadata = oss.getObjectMetadata(bucketName, objKey)
                return Pair( objKey, objectMetadata)
            }
        } catch (oe: OSSException) {
            println(
                "Caught an OSSException, which means your request made it to OSS, "
                        + "but was rejected with an error response for some reason."
            );
            println("Error Message:" + oe.errorMessage);
            println("Error Code:" + oe.errorCode);
            println("Request ID:" + oe.requestId);
            println("Host ID:" + oe.hostId);
            return null
        } catch (ce: ClientException) {
            println(
                "Caught an ClientException, which means the client encountered "
                        + "a serious internal problem while trying to communicate with OSS, "
                        + "such as not being able to access the network."
            );
            println("Error Message:" + ce.message);
            return null
        } finally {
            oss.shutdown()
        }
    }


}



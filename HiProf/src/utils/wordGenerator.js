/**
 * Word文档生成工具
 * 用于将AI生成的教案内容转换为Word文档
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import { parseLessonPlan } from './lessonParser.js'

/**
 * 生成Word文档并下载
 * @param {string} content - AI生成的教案内容
 * @param {string} filename - 文件名（可选）
 */
export async function downloadLessonPlanAsWord(content, filename) {
  try {
    console.log('开始生成Word文档...')

    // 检查浏览器支持
    if (!isWordDownloadSupported()) {
      throw new Error('当前浏览器不支持Word文档下载功能')
    }

    // 解析教案内容
    console.log('解析教案内容...')
    const parsedData = parseLessonPlan(content)
    console.log('解析结果:', parsedData)

    // 创建Word文档
    console.log('创建Word文档...')
    const doc = createWordDocument(parsedData)

    // 生成文件名
    const finalFilename = filename || generateFilename(parsedData.title)
    console.log('文件名:', finalFilename)

    // 生成并下载文档
    console.log('开始下载文档...')
    await downloadDocument(doc, finalFilename)

    console.log('Word文档生成并下载成功!')
    return true
  } catch (error) {
    console.error('生成Word文档失败:', error)
    throw new Error(`生成Word文档失败: ${error.message}`)
  }
}

/**
 * 创建Word文档
 * @param {Object} parsedData - 解析后的教案数据
 * @returns {Document} Word文档对象
 */
function createWordDocument(parsedData) {
  const { title, modules } = parsedData
  
  // 创建文档段落数组
  const children = []
  
  // 添加文档标题
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 32, // 16pt
          font: "Microsoft YaHei"
        })
      ],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 400 // 段后间距
      }
    })
  )
  
  // 添加生成时间
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `生成时间：${new Date().toLocaleString('zh-CN')}`,
          size: 20, // 10pt
          font: "Microsoft YaHei",
          color: "666666"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 600 // 段后间距
      }
    })
  )
  
  // 添加分隔线
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "————————————————————————————————————————",
          size: 20,
          font: "Microsoft YaHei",
          color: "CCCCCC"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 400
      }
    })
  )
  
  // 添加各个模块
  modules.forEach((module, index) => {
    // 模块标题
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: module.title,
            bold: true,
            size: 28, // 14pt
            font: "Microsoft YaHei",
            color: "2E5BBA"
          })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: {
          before: index === 0 ? 0 : 400, // 第一个模块前不加间距
          after: 200
        }
      })
    )
    
    // 模块内容
    const contentLines = module.content.split('\n').filter(line => line.trim())
    
    contentLines.forEach(line => {
      const trimmedLine = line.trim()
      if (trimmedLine) {
        // 检查是否是列表项
        const isListItem = trimmedLine.startsWith('-') || trimmedLine.startsWith('•') || /^\d+\./.test(trimmedLine)
        
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmedLine,
                size: 24, // 12pt
                font: "Microsoft YaHei"
              })
            ],
            spacing: {
              after: 120 // 行间距
            },
            indent: isListItem ? {
              left: 400 // 列表项缩进
            } : undefined
          })
        )
      }
    })
    
    // 模块间添加空行
    if (index < modules.length - 1) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "" })],
          spacing: { after: 200 }
        })
      )
    }
  })
  
  // 添加页脚信息
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "————————————————————————————————————————",
          size: 20,
          font: "Microsoft YaHei",
          color: "CCCCCC"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: {
        before: 600,
        after: 200
      }
    })
  )
  
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "本教案由Hi Prof AI助手生成",
          size: 20,
          font: "Microsoft YaHei",
          color: "999999",
          italics: true
        })
      ],
      alignment: AlignmentType.CENTER
    })
  )
  
  // 创建文档
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children
      }
    ]
  })
  
  return doc
}

/**
 * 生成文件名
 * @param {string} title - 教案标题
 * @returns {string} 文件名
 */
function generateFilename(title) {
  // 清理标题，移除特殊字符
  const cleanTitle = title.replace(/[<>:"/\\|?*]/g, '').trim()
  
  // 生成时间戳
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
  
  // 如果标题太长，截取前20个字符
  const shortTitle = cleanTitle.length > 20 ? cleanTitle.slice(0, 20) + '...' : cleanTitle
  
  return `${shortTitle}_${timestamp}.docx`
}

/**
 * 下载文档
 * @param {Document} doc - Word文档对象
 * @param {string} filename - 文件名
 */
async function downloadDocument(doc, filename) {
  try {
    console.log('开始生成文档Blob...')

    // 在浏览器环境中使用 toBlob 方法而不是 toBuffer
    const blob = await Packer.toBlob(doc)
    console.log('Blob生成成功, 大小:', blob.size, 'bytes')

    // 检查blob是否有效
    if (!blob || blob.size === 0) {
      throw new Error('生成的文档为空')
    }

    // 创建下载链接
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = filename
    link.style.display = 'none'

    console.log('开始触发下载...')

    // 触发下载
    document.body.appendChild(link)
    link.click()

    // 延迟清理，确保下载开始
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      console.log('下载链接已清理')
    }, 100)

  } catch (error) {
    console.error('下载文档失败:', error)
    throw new Error(`下载文档失败: ${error.message}`)
  }
}

/**
 * 检查是否支持Word下载功能
 * @returns {boolean} 是否支持
 */
export function isWordDownloadSupported() {
  // 检查浏览器是否支持必要的API
  return typeof Blob !== 'undefined' &&
         typeof URL !== 'undefined' &&
         typeof URL.createObjectURL === 'function' &&
         typeof document !== 'undefined' &&
         typeof document.createElement === 'function'
}

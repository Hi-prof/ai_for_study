export const parseStructuredKnowledgeContent = (content) => {
  if (!content || typeof content !== 'string') {
    return null
  }
  try {
    const parsed = JSON.parse(content)
    if (parsed && typeof parsed === 'object' && (parsed.lightweightCard || parsed.deepCard || parsed.isFocus !== undefined)) {
      return parsed
    }
  } catch (error) {
    return null
  }
  return null
}

export const joinKnowledgeList = (value) => {
  if (!Array.isArray(value)) {
    return ''
  }
  return value.map(item => String(item)).filter(Boolean).join('、')
}

export const buildKnowledgeCardItems = (card, fields) => {
  if (!card) {
    return []
  }
  return fields
    .map(([label, getter]) => ({ label, value: getter(card) || '' }))
    .filter(item => item.value && String(item.value).trim())
}

export const buildUnifiedKnowledgeCardItems = (structuredContent) => {
  if (!structuredContent) {
    return []
  }

  const lightCard = structuredContent.lightweightCard || {}
  const deepCard = structuredContent.deepCard || {}

  return [
    ['定义', lightCard.definition || ''],
    ['关键词', joinKnowledgeList(lightCard.keywords)],
    ['示例', lightCard.example || ''],
    ['关联知识', joinKnowledgeList(lightCard.relatedKnowledge)],
    ['深入解析', deepCard.detailedDefinition || ''],
    ['核心特征', joinKnowledgeList(deepCard.coreFeatures)],
    ['应用场景', joinKnowledgeList(deepCard.applicationScenarios)],
    ['常见问题', joinKnowledgeList(deepCard.commonQuestions)],
    ['关联说明', deepCard.relatedExplanation || ''],
    ['参考内容', joinKnowledgeList(deepCard.references)]
  ]
    .map(([label, value]) => ({ label, value }))
    .filter(item => item.value && String(item.value).trim())
}

export const buildKnowledgeCardPreviewText = (content) => {
  const structuredContent = typeof content === 'string'
    ? parseStructuredKnowledgeContent(content)
    : content

  if (!structuredContent) {
    return typeof content === 'string' ? content : ''
  }

  return buildUnifiedKnowledgeCardItems(structuredContent)
    .slice(0, 3)
    .map(item => `${item.label}：${item.value}`)
    .join('；')
}

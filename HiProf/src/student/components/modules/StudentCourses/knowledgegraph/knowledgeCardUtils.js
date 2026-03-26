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

export const getKnowledgeCardLabel = (structuredContent, property, fallbackLabel) => {
  const customLabel = structuredContent?.fieldLabels?.[property]
  if (typeof customLabel === 'string' && customLabel.trim()) {
    return customLabel.trim()
  }
  return fallbackLabel
}

export const buildUnifiedKnowledgeCardItems = (structuredContent) => {
  if (!structuredContent) {
    return []
  }

  const lightCard = structuredContent.lightweightCard || {}
  const deepCard = structuredContent.deepCard || {}

  return [
    [getKnowledgeCardLabel(structuredContent, 'definition', '定义'), lightCard.definition || ''],
    [getKnowledgeCardLabel(structuredContent, 'keywords', '关键词'), joinKnowledgeList(lightCard.keywords)],
    [getKnowledgeCardLabel(structuredContent, 'example', '示例'), lightCard.example || ''],
    [getKnowledgeCardLabel(structuredContent, 'relatedKnowledge', '关联知识'), joinKnowledgeList(lightCard.relatedKnowledge)],
    [getKnowledgeCardLabel(structuredContent, 'detailedDefinition', '深入解析'), deepCard.detailedDefinition || ''],
    [getKnowledgeCardLabel(structuredContent, 'coreFeatures', '核心特征'), joinKnowledgeList(deepCard.coreFeatures)],
    [getKnowledgeCardLabel(structuredContent, 'applicationScenarios', '应用场景'), joinKnowledgeList(deepCard.applicationScenarios)],
    [getKnowledgeCardLabel(structuredContent, 'commonQuestions', '常见问题'), joinKnowledgeList(deepCard.commonQuestions)],
    [getKnowledgeCardLabel(structuredContent, 'relatedExplanation', '关联说明'), deepCard.relatedExplanation || ''],
    [getKnowledgeCardLabel(structuredContent, 'references', '参考内容'), joinKnowledgeList(deepCard.references)]
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

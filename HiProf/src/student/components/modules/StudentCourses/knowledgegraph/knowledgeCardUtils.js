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

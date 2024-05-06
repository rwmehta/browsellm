import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import Groq from 'groq-sdk'

import { $provider, $allApiKeys, $model } from '../store'

const getDom = async () => {
  const queryOptions = { active: true, lastFocusedWindow: true }
  const [tab] = await chrome.tabs?.query(queryOptions)

  if (tab.id) {
    return await chrome.tabs?.sendMessage(tab.id, { action: 'getDom' })
  } else {
    return null
  }
}

export const request = async (prompt: string) => {
  const dom = await getDom()

  const content = `
    You will receive two inputs. The first one is a task (starting with "Task: "), and the second is a DOM (starting with "DOM: ").
    You should generate a javascript code that if executed in the page with the given task, it can achieve the required task.
    Make sure to generate correct browser javascript code and only return a code, nothing else.
    Enclose the javascript code like this: append "--------------------" at the start and end of the code block so I can extract the code.

    Task: ${prompt}

    DOM: ${dom}
  `

  switch ($provider.get()) {
    case 'groq':
      const groq = new Groq({
        apiKey: $allApiKeys.get().groq
      })

      return (await groq.chat.completions.create({
        messages: [{ role: 'user', content }],
        model: $model.get(),
      })).choices[0].message.content
    
    case 'anthropic':
      const anthropic = new Anthropic({
        apiKey: $allApiKeys.get().anthropic
      })

      return (await anthropic.messages.create({
        max_tokens: 500,
        messages: [{ role: 'user', content }],
        model: $model.get(),
      })).content[0].text


    case 'openai':
      const openai = new OpenAI({
        apiKey: $allApiKeys.get().openai
      })

      return (await openai.chat.completions.create({
        messages: [{ role: 'user', content }],
        model: $model.get(),
      })).choices[0].message.content

    default:
      throw new Error('Provider does not exist.')
  }
}

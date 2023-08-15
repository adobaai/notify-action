import {request} from 'https'

export enum CardTemplate {
  /** 蓝色 */ Blue = 'blue',
  /** 靛蓝色 */ Indigo = 'indigo',
  /** 胭脂红 */ Carmine = 'carmine',
  /** 浅蓝色 */ Wathet = 'wathet',
  /** 堇紫色 */ Violet = 'violet',
  /** 绿松色 */ Turquoise = 'turquoise'
}

type MessageType = 'interactive'

class Message {
  type: MessageType
  card?: Card

  constructor(type: MessageType) {
    this.type = type
  }

  setCard(c: Card): this {
    this.card = c
    return this
  }

  toJSON(): object {
    return {
      msg_type: this.type,
      card: this.card?.render()
    }
  }
}

export interface Element {
  render(): object
}

export class Markdown implements Element {
  content: string

  constructor(content: string) {
    this.content = content
  }

  render(): object {
    return {
      tag: 'markdown',
      content: this.content
    }
  }
}

export class Text implements Element {
  content: string

  constructor(content: string) {
    this.content = content
  }

  render(): object {
    return {
      tag: 'div',
      text: {
        tag: 'plain_text',
        content: this.content
      }
    }
  }
}

class CardHeader {
  template: CardTemplate
  title: string

  constructor(template: CardTemplate, title: string) {
    this.template = template
    this.title = title
  }

  render(): object {
    return {
      template: this.template,
      title: {
        content: this.title,
        tag: 'plain_text'
      }
    }
  }
}

export class Card {
  private header: CardHeader
  private elements: Element[]

  constructor(template: CardTemplate, title: string) {
    this.header = new CardHeader(template, title)
    this.elements = []
  }

  addElements(...e: Element[]): this {
    this.elements.push(...e)
    return this
  }

  render(): object {
    return {
      header: this.header?.render(),
      elements: this.elements.map(x => x.render())
    }
  }

  toMessage(): Message {
    return new Message('interactive').setCard(this)
  }
}

export async function send(webhook: string, msg: Message): Promise<void> {
  return new Promise(function (resolve, reject) {
    const req = request(webhook, {method: 'POST'}, resp => {
      if (!resp.statusCode || resp.statusCode < 200 || resp.statusCode >= 300) {
        return reject(new Error(`statusCode=${resp.statusCode}`))
      }

      const body = new Array<Uint8Array>()
      resp.on('data', chunk => body.push(chunk))
      resp.on('end', () => {
        let j
        try {
          j = JSON.parse(Buffer.concat(body).toString())
        } catch (e) {
          reject(e)
        }
        // Server returns {"Extra":null,"StatusCode":0,"StatusMessage":"success"} on success,
        // otherwise it returns {"code":9499,"msg":"Bad Request","data":{}}.
        //
        // Ref https://github.com/megaease/easeprobe/blob/5b3a33c0eacafeffde0d38f9a65a0218468d5fb0/notify/lark/lark.go#L84
        if (j.StatusCode === 0) {
          resolve()
        } else {
          reject(j)
        }
      })
    })

    req.on('error', err => reject(err))
    req.write(JSON.stringify(msg))
    req.end()
  })
}

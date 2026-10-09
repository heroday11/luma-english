import json
from pathlib import Path
root = Path(__file__).resolve().parent
path = root / "learning-content.json"
content = json.loads(path.read_text(encoding="utf-8"))
extra = {
  "gesture": {
    "phonetic": "/ˈdʒestʃə/",
    "senses": [
      {
        "pos": "v.",
        "en": "To communicate or show something by moving your hands or body.",
        "zh": "做手势；用身体动作示意。",
        "exampleEn": "She gestured toward the empty seat.",
        "exampleZh": "她朝那个空座位做了个手势。"
      },
      {
        "pos": "n.",
        "en": "A movement of the hands or body that expresses an idea or feeling.",
        "zh": "手势；表达想法或感受的身体动作。",
        "exampleEn": "He welcomed us with a friendly gesture.",
        "exampleZh": "他用一个友好的手势欢迎我们。"
      },
      {
        "pos": "n.",
        "en": "An action intended to show a particular attitude.",
        "zh": "表示某种态度的举动。",
        "exampleEn": "The gift was a gesture of thanks.",
        "exampleZh": "这份礼物是表达感谢的举动。"
      }
    ],
    "imageQuery": "hand gesture pointing",
    "scene": "用一个手势指向空座位"
  },
  "share": {
    "phonetic": "/ʃeə/",
    "senses": [
      {
        "pos": "n.",
        "en": "A portion of something that belongs to or is expected from one person.",
        "zh": "一份；某人应得或应承担的部分。",
        "exampleEn": "Everyone should do their share of the work.",
        "exampleZh": "每个人都应该完成自己那份工作。"
      },
      {
        "pos": "v.",
        "en": "To use or enjoy something together with another person.",
        "zh": "分享；共同使用或享受。",
        "exampleEn": "We shared a meal after the meeting.",
        "exampleZh": "会议结束后，我们一起吃了顿饭。"
      },
      {
        "pos": "n.",
        "en": "One of the equal parts of a company's ownership that people can buy.",
        "zh": "股份；公司所有权中可买卖的一份。",
        "exampleEn": "She bought shares in a technology company.",
        "exampleZh": "她购买了一家科技公司的股份。"
      }
    ],
    "imageQuery": "people sharing meal table",
    "scene": "共享一顿饭，各自承担一份工作"
  },
  "puzzled": {
    "phonetic": "/ˈpʌzld/",
    "senses": [
      {
        "pos": "adj.",
        "en": "Unable to understand something and wanting an explanation.",
        "zh": "困惑的；因不理解而感到迷惑的。",
        "exampleEn": "The unexpected result left the researcher puzzled.",
        "exampleZh": "这个意外的结果让研究者感到困惑。"
      }
    ],
    "imageQuery": "person puzzled question",
    "scene": "面对意外结果，疑惑地思考"
  },
  "observe": {
    "phonetic": "/əbˈzɜːv/",
    "senses": [
      {
        "pos": "v.",
        "en": "To express a comment, especially about something one has noticed.",
        "zh": "评论；就注意到的事情发表看法。",
        "exampleEn": "She observed that the meeting had lasted too long.",
        "exampleZh": "她评论说，这场会议持续得太久了。"
      },
      {
        "pos": "v.",
        "en": "To watch or notice something carefully.",
        "zh": "观察；仔细观看或注意。",
        "exampleEn": "The scientist observed how the birds built their nests.",
        "exampleZh": "科学家观察了鸟类如何筑巢。"
      },
      {
        "pos": "v.",
        "en": "To follow a rule, custom, or particular occasion.",
        "zh": "遵守规则；奉行习俗；庆祝或纪念某个日子。",
        "exampleEn": "All visitors must observe the safety rules.",
        "exampleZh": "所有访客都必须遵守安全规定。"
      }
    ],
    "imageQuery": "scientist observing birds binoculars",
    "scene": "仔细观察，再发表看法"
  },
  "episode": {
    "phonetic": "/ˈepɪsəʊd/",
    "senses": [
      {
        "pos": "n.",
        "en": "An event that forms one part of a longer experience or series of events.",
        "zh": "插曲；一段经历或一连串事件中的一个部分。",
        "exampleEn": "The disagreement was only a brief episode in their friendship.",
        "exampleZh": "这次分歧只是他们友谊中的一段短暂插曲。"
      },
      {
        "pos": "n.",
        "en": "One separate part of a television or radio series.",
        "zh": "电视或广播系列节目中的一集。",
        "exampleEn": "We watched the final episode together.",
        "exampleZh": "我们一起观看了最后一集。"
      }
    ],
    "imageQuery": "television series episode",
    "scene": "一段故事中的小插曲"
  },
  "expectation": {
    "phonetic": "/ˌekspekˈteɪʃən/",
    "senses": [
      {
        "pos": "n.",
        "en": "A belief or hope that something will happen in a particular way.",
        "zh": "期望；对某事会如何发生的希望或预期。",
        "exampleEn": "The course exceeded my expectations.",
        "exampleZh": "这门课程超出了我的预期。"
      },
      {
        "pos": "n.",
        "en": "A standard that people believe someone should meet.",
        "zh": "要求；人们认为某人应该达到的标准。",
        "exampleEn": "The teacher clearly explained her expectations.",
        "exampleZh": "老师清楚地说明了她的要求。"
      }
    ],
    "imageQuery": "student hopeful future",
    "scene": "对学习成果抱有期望"
  },
  "crystallize": {
    "phonetic": "/ˈkrɪstəlaɪz/",
    "senses": [
      {
        "pos": "v.",
        "en": "To make an idea clear and definite, or to become clear and definite.",
        "zh": "使明确化；使具体化；变得清晰明确。",
        "exampleEn": "The discussion helped crystallize our plans.",
        "exampleZh": "这场讨论帮助我们明确了计划。"
      },
      {
        "pos": "v.",
        "en": "To form crystals or cause a substance to form crystals.",
        "zh": "结晶；使物质形成晶体。",
        "exampleEn": "Sugar crystallized as the solution cooled.",
        "exampleZh": "溶液冷却时，糖结晶了。"
      }
    ],
    "imageQuery": "sugar crystals closeup",
    "scene": "结晶成形，联想想法逐渐清晰"
  },
  "represent": {
    "phonetic": "/ˌreprɪˈzent/",
    "senses": [
      {
        "pos": "v.",
        "en": "To speak or act officially for a person or group.",
        "zh": "代表；正式替某人或某群体发言或行动。",
        "exampleEn": "She will represent the students at the meeting.",
        "exampleZh": "她将在会议上代表学生。"
      },
      {
        "pos": "v.",
        "en": "To stand for or be a symbol of something.",
        "zh": "象征；表示。",
        "exampleEn": "The blue line represents the river on the map.",
        "exampleZh": "地图上的蓝线表示河流。"
      },
      {
        "pos": "v.",
        "en": "To show or describe something in a particular way.",
        "zh": "描绘；表现；描述。",
        "exampleEn": "The painting represents everyday life in the village.",
        "exampleZh": "这幅画描绘了村庄的日常生活。"
      }
    ],
    "imageQuery": "student representative meeting",
    "scene": "学生代表在会议中发言"
  },
  "irony": {
    "phonetic": "/ˈaɪrəni/",
    "senses": [
      {
        "pos": "n.",
        "en": "A situation in which the result is strikingly different from what one would expect.",
        "zh": "具有讽刺意味的情况；结果与预期形成鲜明反差。",
        "exampleEn": "The irony is that the time-saving tool made the task slower.",
        "exampleZh": "讽刺的是，这个节省时间的工具反而让任务完成得更慢。"
      },
      {
        "pos": "n.",
        "en": "The use of words that suggest the opposite of their literal meaning.",
        "zh": "反语；用字面上相反的说法表达真实意思。",
        "exampleEn": "Calling the rainy day perfect was an example of irony.",
        "exampleZh": "把那个雨天称为完美的一天，就是使用反语的例子。"
      }
    ],
    "imageQuery": "rain umbrella irony",
    "scene": "期待晴天，结果却遇到大雨"
  },
  "crisis": {
    "phonetic": "/ˈkraɪsɪs/",
    "senses": [
      {
        "pos": "n.",
        "en": "A serious situation that requires urgent decisions or action.",
        "zh": "危机；需要紧急决策或行动的严重局面。",
        "exampleEn": "The water shortage has become a crisis.",
        "exampleZh": "缺水已经演变成了一场危机。"
      },
      {
        "pos": "n.",
        "en": "A very difficult stage in a person's life.",
        "zh": "人生中的重大困境或艰难阶段。",
        "exampleEn": "Friends helped him through a personal crisis.",
        "exampleZh": "朋友们帮助他渡过了个人生活中的危机。"
      }
    ],
    "imageQuery": "water shortage reservoir drought",
    "scene": "缺水局面需要紧急应对"
  },
  "wreak": {
    "phonetic": "/riːk/",
    "senses": [
      {
        "pos": "v.",
        "en": "To cause serious damage or suffering; often used with 'havoc'.",
        "zh": "造成严重破坏或痛苦；常与 havoc 连用。",
        "exampleEn": "The storm wreaked havoc on the coastal roads.",
        "exampleZh": "这场风暴对沿海道路造成了严重破坏。"
      }
    ],
    "imageQuery": "storm damage road",
    "scene": "风暴造成严重破坏"
  },
  "stereotypical": {
    "phonetic": "/ˌsteriəˈtɪpɪkəl/",
    "senses": [
      {
        "pos": "adj.",
        "en": "Matching a common, simplified idea about a type of person or thing.",
        "zh": "符合刻板印象的；呈现常见而简化的典型形象的。",
        "exampleEn": "The film avoids stereotypical images of suburban life.",
        "exampleZh": "这部电影避免使用关于郊区生活的刻板形象。"
      }
    ],
    "imageQuery": "suburban houses street",
    "scene": "熟悉的典型形象可能只是刻板印象"
  },
  "havoc": {
    "phonetic": "/ˈhævək/",
    "senses": [
      {
        "pos": "n.",
        "en": "Widespread damage, disorder, or disruption.",
        "zh": "严重破坏；混乱；大范围的扰乱。",
        "exampleEn": "A sudden power failure caused havoc at the station.",
        "exampleZh": "突然停电使车站陷入严重混乱。"
      }
    ],
    "imageQuery": "storm destruction debris",
    "scene": "损坏与混乱充满现场"
  },
  "scene": {
    "phonetic": "/siːn/",
    "senses": [
      {
        "pos": "n.",
        "en": "A place and the things happening there at a particular time.",
        "zh": "场景；某个地点及当时发生的事情。",
        "exampleEn": "The scene outside the station was unusually quiet.",
        "exampleZh": "车站外的场景异常安静。"
      },
      {
        "pos": "n.",
        "en": "One part of a play or film that takes place in one setting.",
        "zh": "戏剧或电影中的一场；一个片段。",
        "exampleEn": "The opening scene introduces the main character.",
        "exampleZh": "开场那一幕介绍了主角。"
      },
      {
        "pos": "n.",
        "en": "The place where an event, especially a crime or accident, happened.",
        "zh": "事件发生地点；犯罪或事故现场。",
        "exampleEn": "Police quickly arrived at the scene of the accident.",
        "exampleZh": "警方很快到达了事故现场。"
      }
    ],
    "imageQuery": "city street scene",
    "scene": "观察城市街道的一幕"
  },
  "quasi-automatic": {
    "senses": [
      {
        "pos": "adj.",
        "en": "Operating almost automatically, while still requiring some human input.",
        "zh": "准自动的；基本自动运行但仍需部分人工参与的。",
        "exampleEn": "The quasi-automatic system still needs a person to approve each transfer.",
        "exampleZh": "这套准自动系统仍需要人工批准每次转账。"
      }
    ],
    "imageQuery": "automated industrial control",
    "scene": "机器自动运行，关键步骤由人确认"
  },
  "self-enhancing": {
    "senses": [
      {
        "pos": "adj.",
        "en": "Improving or presenting a favorable view of one's own qualities or worth.",
        "zh": "自我提升的；提升或美化对自身品质、价值的看法的。",
        "exampleEn": "Self-enhancing beliefs can make people overlook their weaknesses.",
        "exampleZh": "自我拔高的想法可能使人忽视自己的弱点。"
      }
    ],
    "imageQuery": "person mirror confidence",
    "scene": "自我评价与镜中的形象"
  },
  "self-enhancement": {
    "senses": [
      {
        "pos": "n.",
        "en": "The tendency or effort to see oneself in a more favorable way.",
        "zh": "自我强化；自我拔高；倾向于更积极地看待自己。",
        "exampleEn": "The study examined self-enhancement in personal judgments.",
        "exampleZh": "这项研究考察了个人判断中的自我拔高倾向。"
      }
    ],
    "imageQuery": "person confidence reflection",
    "scene": "个人判断中的积极自我评价"
  },
  "nonparents": {
    "senses": [
      {
        "pos": "n. plural",
        "en": "People who do not have children.",
        "zh": "无子女者；没有孩子的人。",
        "exampleEn": "The survey compared the daily routines of parents and nonparents.",
        "exampleZh": "这项调查比较了父母和无子女者的日常安排。"
      }
    ],
    "imageQuery": "adults community park",
    "scene": "比较不同人群的日常生活"
  },
  "bleed-over": {
    "senses": [
      {
        "pos": "n.",
        "en": "The spread of an effect from one area or situation into another.",
        "zh": "渗透；某种影响从一个领域扩散到另一个领域。",
        "exampleEn": "There was bleed-over from work stress into family life.",
        "exampleZh": "工作压力的影响渗透到了家庭生活中。"
      }
    ],
    "imageQuery": "watercolor colors bleeding",
    "scene": "颜色渗开，联想影响向外扩散"
  },
  "well-structured": {
    "senses": [
      {
        "pos": "adj.",
        "en": "Organized into clear parts that fit together effectively.",
        "zh": "结构良好的；条理清晰且各部分衔接合理的。",
        "exampleEn": "A well-structured report makes the argument easier to follow.",
        "exampleZh": "一份结构良好的报告使论证更容易理解。"
      }
    ],
    "imageQuery": "organized notes report",
    "scene": "清晰的大纲让内容有条理"
  },
  "incentive-based": {
    "senses": [
      {
        "pos": "adj.",
        "en": "Using rewards or other benefits to encourage particular actions.",
        "zh": "基于激励的；通过奖励或好处鼓励特定行为的。",
        "exampleEn": "The incentive-based program rewards households that save energy.",
        "exampleZh": "这项激励计划奖励节约能源的家庭。"
      }
    ],
    "imageQuery": "reward achievement medal",
    "scene": "奖励鼓励人们采取行动"
  },
  "prosociality": {
    "senses": [
      {
        "pos": "n.",
        "en": "A tendency to behave in ways that help or benefit other people.",
        "zh": "亲社会性；倾向于帮助他人或让他人受益的行为特征。",
        "exampleEn": "The researchers measured prosociality through acts of cooperation.",
        "exampleZh": "研究者通过合作行为衡量亲社会性。"
      }
    ],
    "imageQuery": "volunteers helping community",
    "scene": "互相帮助与合作"
  },
  "a handful of sb sth": {
    "senses": [
      {
        "pos": "phrase",
        "en": "A small number of people or things; the usual pattern is 'a handful of' plus a plural noun.",
        "zh": "少数人或物；常见结构为 a handful of 加复数名词。",
        "exampleEn": "Only a handful of students stayed after the lecture.",
        "exampleZh": "讲座结束后，只有少数学生留了下来。"
      }
    ],
    "imageQuery": "small group students",
    "scene": "一小群留下来的学生"
  },
  "rural economy": {
    "senses": [
      {
        "pos": "n. phrase",
        "en": "Economic activities and livelihoods in countryside areas.",
        "zh": "乡村经济；农村地区的经济活动与生计。",
        "exampleEn": "Small farms remain important to the rural economy.",
        "exampleZh": "小型农场对乡村经济仍然很重要。"
      }
    ],
    "imageQuery": "rural farms countryside",
    "scene": "农田与乡村生产活动"
  },
  "net-zero strategy": {
    "senses": [
      {
        "pos": "n. phrase",
        "en": "A plan to balance greenhouse gas emissions with equivalent removals.",
        "zh": "净零排放战略；使温室气体排放量与移除量达到平衡的计划。",
        "exampleEn": "The company's net-zero strategy includes cutting energy use.",
        "exampleZh": "公司的净零排放战略包括减少能源使用。"
      }
    ],
    "imageQuery": "renewable energy wind turbines forest",
    "scene": "减少排放与增加碳移除"
  },
  "rewilding": {
    "senses": [
      {
        "pos": "n.",
        "en": "Restoring an area so that natural processes and wildlife can recover.",
        "zh": "再野化；恢复一个地区的自然过程与野生生物。",
        "exampleEn": "Rewilding has brought native plants back to the valley.",
        "exampleZh": "再野化使本地植物重新回到了这个山谷。"
      }
    ],
    "imageQuery": "rewilding woodland wildlife",
    "scene": "让本地植物和野生动物重新繁盛"
  },
  "wide range of": {
    "senses": [
      {
        "pos": "phrase",
        "en": "Many different types of something; often used as 'a wide range of'.",
        "zh": "范围广泛的；各种各样的；常用 a wide range of。",
        "exampleEn": "The library offers a wide range of books.",
        "exampleZh": "这家图书馆提供各种各样的书籍。"
      }
    ],
    "imageQuery": "library diverse books",
    "scene": "书架上种类丰富的图书"
  },
  "service norms": {
    "senses": [
      {
        "pos": "n. phrase",
        "en": "Shared rules or expectations about how a service should be provided.",
        "zh": "服务规范；对服务提供方式的共同规则或期待。",
        "exampleEn": "Clear service norms help staff respond consistently.",
        "exampleZh": "清晰的服务规范有助于员工以一致的方式回应顾客。"
      }
    ],
    "imageQuery": "customer service staff",
    "scene": "工作人员遵循共同的服务标准"
  },
  "digital payment devices": {
    "senses": [
      {
        "pos": "n. phrase",
        "en": "Electronic equipment used to make or accept payments.",
        "zh": "数字支付设备；用于进行或接收电子支付的设备。",
        "exampleEn": "Digital payment devices are now common in small shops.",
        "exampleZh": "数字支付设备如今在小商店里很常见。"
      }
    ],
    "imageQuery": "payment terminal card reader",
    "scene": "刷卡机与电子支付"
  },
  "tip requests": {
    "senses": [
      {
        "pos": "n. phrase",
        "en": "Messages or questions asking customers to leave a gratuity.",
        "zh": "索要小费的提示或请求。",
        "exampleEn": "Tip requests appeared on the screen before the payment was complete.",
        "exampleZh": "付款完成之前，屏幕上就出现了索要小费的提示。"
      }
    ],
    "imageQuery": "payment terminal tip screen",
    "scene": "结账屏幕出现小费请求"
  },
  "ever-higher": {
    "senses": [
      {
        "pos": "adj.",
        "en": "Increasing to higher and higher levels.",
        "zh": "越来越高的；持续升高的。",
        "exampleEn": "Ever-higher prices put pressure on household budgets.",
        "exampleZh": "越来越高的价格给家庭预算带来压力。"
      }
    ],
    "imageQuery": "rising price chart",
    "scene": "价格曲线不断向上"
  },
  "be dissociated": {
    "senses": [
      {
        "pos": "v. phrase",
        "en": "To be separated or no longer connected; often followed by 'from'.",
        "zh": "被分离；与某事脱节；常接 from。",
        "exampleEn": "The decision should not be dissociated from its social context.",
        "exampleZh": "这一决定不应该脱离其社会背景来理解。"
      }
    ],
    "imageQuery": "separated puzzle pieces",
    "scene": "彼此分离、失去联系的拼图"
  },
  "be intended to": {
    "senses": [
      {
        "pos": "v. phrase",
        "en": "To have a particular purpose or planned effect; followed by a verb.",
        "zh": "旨在；目的是；后接动词表示计划实现的作用。",
        "exampleEn": "The new policy is intended to reduce waiting times.",
        "exampleZh": "这项新政策旨在减少等待时间。"
      }
    ],
    "imageQuery": "planning target goal",
    "scene": "围绕目标制定计划"
  },
  "be on waitlists": {
    "senses": [
      {
        "pos": "v. phrase",
        "en": "To be listed among people waiting for a place, service, or treatment.",
        "zh": "在等候名单上；排队等待名额、服务或治疗。",
        "exampleEn": "Many patients are on waitlists for routine surgery.",
        "exampleZh": "许多患者在等候名单上等待常规手术。"
      }
    ],
    "imageQuery": "waiting room hospital patients",
    "scene": "患者等待安排治疗"
  },
  "opt to do": {
    "senses": [
      {
        "pos": "v. phrase",
        "en": "To choose to take a particular action; 'do' stands for the action verb.",
        "zh": "选择做某事；do 表示随后替换的动作动词。",
        "exampleEn": "Some residents opt to travel by bus.",
        "exampleZh": "一些居民选择乘公交车出行。"
      }
    ],
    "imageQuery": "person choosing bus transport",
    "scene": "选择一种出行方式"
  },
  "private medical services": {
    "senses": [
      {
        "pos": "n. phrase",
        "en": "Healthcare provided by privately run organizations or practitioners.",
        "zh": "私立医疗服务；由私人经营的机构或医务人员提供的医疗服务。",
        "exampleEn": "Private medical services may offer shorter waiting times.",
        "exampleZh": "私立医疗服务可能提供较短的等待时间。"
      }
    ],
    "imageQuery": "private clinic healthcare",
    "scene": "诊所提供医疗服务"
  },
  "well rehearsed": {
    "senses": [
      {
        "pos": "adj. phrase",
        "en": "Practiced carefully before being performed.",
        "zh": "经过充分排练的；事先练习熟练的。",
        "exampleEn": "The students gave a well rehearsed performance.",
        "exampleZh": "学生们呈现了一场经过充分排练的演出。"
      },
      {
        "pos": "adj. phrase",
        "en": "Repeated or discussed so often that it has become familiar.",
        "zh": "被反复讨论而令人熟悉的；老生常谈的。",
        "exampleEn": "The objections to the plan were already well rehearsed.",
        "exampleZh": "对这项计划的反对意见早已是老生常谈。"
      }
    ],
    "imageQuery": "rehearsal performers stage",
    "scene": "反复排练，熟悉每个细节"
  },
  "be troubled": {
    "senses": [
      {
        "pos": "v. phrase",
        "en": "To feel worried or be affected by a problem.",
        "zh": "感到困扰；受到某种问题的影响。",
        "exampleEn": "Residents were troubled by the rising cost of care.",
        "exampleZh": "居民们受到护理费用上涨的困扰。"
      }
    ],
    "imageQuery": "worried person thinking",
    "scene": "面对问题而担忧"
  },
  "social care": {
    "senses": [
      {
        "pos": "n. phrase",
        "en": "Support that helps people manage daily life when they need assistance.",
        "zh": "社会护理；为日常生活需要帮助的人提供的支持服务。",
        "exampleEn": "Social care can help older people live independently.",
        "exampleZh": "社会护理可以帮助老年人独立生活。"
      }
    ],
    "imageQuery": "elderly care caregiver",
    "scene": "护理人员帮助长者生活"
  },
  "reform think tank": {
    "senses": [
      {
        "pos": "n. phrase",
        "en": "A research organization that develops ideas for changing policies or institutions.",
        "zh": "改革智库；研究并提出政策或制度改革方案的机构。",
        "exampleEn": "A reform think tank published proposals for better public services.",
        "exampleZh": "一家改革智库发布了改善公共服务的建议。"
      }
    ],
    "imageQuery": "policy researchers meeting",
    "scene": "研究人员讨论政策改革方案"
  },
  "hospital-centric": {
    "senses": [
      {
        "pos": "adj.",
        "en": "Organized mainly around hospitals and their role in care.",
        "zh": "以医院为中心的；主要围绕医院组织医疗服务的。",
        "exampleEn": "The report calls for a less hospital-centric model of care.",
        "exampleZh": "这份报告呼吁减少护理模式对医院的集中依赖。"
      }
    ],
    "imageQuery": "hospital building medical",
    "scene": "医院处于医疗体系的中心"
  },
  "it is estimated that": {
    "senses": [
      {
        "pos": "sentence frame",
        "en": "A phrase used to introduce an approximate calculation or judgment.",
        "zh": "据估计；用于引出大致的计算结果或判断。",
        "exampleEn": "It is estimated that the repairs will take two weeks.",
        "exampleZh": "据估计，维修将需要两周时间。"
      }
    ],
    "imageQuery": "estimated calculation report",
    "scene": "用数据给出大致估计"
  },
  "hefty price": {
    "senses": [
      {
        "pos": "n. phrase",
        "en": "A very large amount of money paid for something.",
        "zh": "高昂的价格或费用。",
        "exampleEn": "The family paid a hefty price for private treatment.",
        "exampleZh": "这个家庭为私立医疗支付了高昂的费用。"
      }
    ],
    "imageQuery": "large bill payment",
    "scene": "一张费用高昂的账单"
  },
  "heat action plans": {
    "senses": [
      {
        "pos": "n. phrase",
        "en": "Plans for preparing for and responding to dangerously hot weather.",
        "zh": "高温行动计划；应对危险高温天气的准备和行动方案。",
        "exampleEn": "Cities updated their heat action plans before summer.",
        "exampleZh": "各城市在夏季到来之前更新了高温行动计划。"
      }
    ],
    "imageQuery": "heatwave city shade water",
    "scene": "高温天气下的避暑与应对"
  },
  "construction laborers": {
    "senses": [
      {
        "pos": "n. phrase",
        "en": "Workers who do physical work on building sites.",
        "zh": "建筑工人；在施工现场从事体力劳动的人员。",
        "exampleEn": "Construction laborers took extra breaks during the heatwave.",
        "exampleZh": "热浪期间，建筑工人增加了休息次数。"
      }
    ],
    "imageQuery": "construction workers building site",
    "scene": "工人在建筑工地施工"
  },
  "emergency warning": {
    "senses": [
      {
        "pos": "n. phrase",
        "en": "An urgent alert about a serious danger or approaching threat.",
        "zh": "紧急预警；关于严重危险或临近威胁的紧急提示。",
        "exampleEn": "The emergency warning told residents to leave the area.",
        "exampleZh": "紧急预警通知居民撤离该区域。"
      }
    ],
    "imageQuery": "emergency warning siren",
    "scene": "警报提醒人们立即应对"
  },
  "triggering threshold": {
    "senses": [
      {
        "pos": "n. phrase",
        "en": "The level at which a condition causes an action or response to begin.",
        "zh": "触发阈值；达到后会启动某种行动或反应的临界水平。",
        "exampleEn": "The alert begins when the temperature reaches the triggering threshold.",
        "exampleZh": "温度达到触发阈值时，预警就会启动。"
      }
    ],
    "imageQuery": "temperature gauge threshold",
    "scene": "数值达到临界点，系统启动预警"
  },
  "trodden dirt track": {
    "senses": [
      {
        "pos": "n. phrase",
        "en": "An unpaved path formed or marked by repeated footsteps.",
        "zh": "踩踏出来的土路；反复走动形成的无铺装小径。",
        "exampleEn": "A trodden dirt track led across the field.",
        "exampleZh": "一条踩踏出来的土路穿过田野。"
      }
    ],
    "imageQuery": "dirt footpath field",
    "scene": "脚步在田间走出一条小路"
  },
  "bisect lawns": {
    "senses": [
      {
        "pos": "v. phrase",
        "en": "To divide lawns into two parts by crossing through them.",
        "zh": "穿过草坪并将其分成两部分。",
        "exampleEn": "Narrow paths bisect lawns in the park.",
        "exampleZh": "狭窄的小路穿过公园的草坪，将其分成两部分。"
      }
    ],
    "imageQuery": "footpath across lawn",
    "scene": "小路穿过草坪"
  },
  "proceed to do": {
    "senses": [
      {
        "pos": "v. phrase",
        "en": "To go on to take the next action; 'do' stands for the action verb.",
        "zh": "接着做某事；继续进行下一步行动。",
        "exampleEn": "After reading the instructions, she proceeded to fill in the form.",
        "exampleZh": "读完说明后，她接着填写了表格。"
      }
    ],
    "imageQuery": "person filling form instructions",
    "scene": "读完说明，接着完成下一步"
  },
  "web-page": {
    "senses": [
      {
        "pos": "n.",
        "en": "A document or screen of information that can be viewed on a website.",
        "zh": "网页；网站上可以浏览的一页信息。",
        "exampleEn": "The web-page explains how to join the course.",
        "exampleZh": "这个网页说明了如何加入课程。"
      }
    ],
    "imageQuery": "website browser computer",
    "scene": "浏览器中的一页信息"
  },
  "be devoted to": {
    "senses": [
      {
        "pos": "v. phrase",
        "en": "To give much of one's time, effort, or attention to something.",
        "zh": "致力于；把大量时间、精力或注意力投入某事。",
        "exampleEn": "The team is devoted to protecting local wildlife.",
        "exampleZh": "这个团队致力于保护当地野生生物。"
      }
    ],
    "imageQuery": "volunteers wildlife conservation",
    "scene": "持续投入精力保护野生生物"
  },
  "be adorned with": {
    "senses": [
      {
        "pos": "v. phrase",
        "en": "To be decorated with something that adds beauty.",
        "zh": "装饰有；用增添美感的事物进行装饰。",
        "exampleEn": "The entrance is adorned with flowers.",
        "exampleZh": "入口装饰着鲜花。"
      }
    ],
    "imageQuery": "entrance decorated flowers",
    "scene": "鲜花装饰着入口"
  },
  "user-driven": {
    "senses": [
      {
        "pos": "adj.",
        "en": "Shaped or guided mainly by users' needs, actions, or feedback.",
        "zh": "用户驱动的；主要由用户需求、行为或反馈推动的。",
        "exampleEn": "The user-driven design process began with interviews.",
        "exampleZh": "用户驱动的设计流程从访谈开始。"
      }
    ],
    "imageQuery": "user feedback design workshop",
    "scene": "用户反馈引导设计改进"
  },
  "grid-based system": {
    "senses": [
      {
        "pos": "n. phrase",
        "en": "A system that arranges or organizes things using a grid.",
        "zh": "网格系统；用网格安排或组织事物的系统。",
        "exampleEn": "The map uses a grid-based system to mark locations.",
        "exampleZh": "这张地图使用网格系统标记位置。"
      }
    ],
    "imageQuery": "map grid layout",
    "scene": "网格帮助定位与组织"
  },
  "be applied": {
    "senses": [
      {
        "pos": "v. phrase",
        "en": "To be used in a particular situation or for a particular purpose.",
        "zh": "被应用；被用于某种情境或目的。",
        "exampleEn": "The method can be applied to other subjects.",
        "exampleZh": "这种方法可以被用于其他学科。"
      }
    ],
    "imageQuery": "practical research application",
    "scene": "把方法用于新的实际情境"
  },
  "mental well-being": {
    "senses": [
      {
        "pos": "n. phrase",
        "en": "A healthy and generally positive state of mind and emotional life.",
        "zh": "心理健康；总体良好的心理与情绪状态。",
        "exampleEn": "Regular exercise can support mental well-being.",
        "exampleZh": "规律运动可以促进心理健康。"
      }
    ],
    "imageQuery": "peaceful person nature walk",
    "scene": "在自然中散步，照顾心理状态"
  },
  "shared trait": {
    "senses": [
      {
        "pos": "n. phrase",
        "en": "A characteristic that two or more people or things have in common.",
        "zh": "共同特征；两个或多个对象共有的特点。",
        "exampleEn": "Curiosity is a shared trait among the researchers.",
        "exampleZh": "好奇心是这些研究者共有的特征。"
      }
    ],
    "imageQuery": "people collaboration common interests",
    "scene": "不同人身上的共同特点"
  },
  "culture department": {
    "senses": [
      {
        "pos": "n. phrase",
        "en": "An administrative unit responsible for cultural matters.",
        "zh": "文化部门；负责文化事务的行政单位。",
        "exampleEn": "The culture department supports local exhibitions.",
        "exampleZh": "文化部门支持当地的展览活动。"
      }
    ],
    "imageQuery": "cultural exhibition city",
    "scene": "文化部门支持城市展览"
  },
  "independent review": {
    "senses": [
      {
        "pos": "n. phrase",
        "en": "An assessment carried out without control by those being assessed.",
        "zh": "独立评估；由不受被评估方控制的人员开展的审查。",
        "exampleEn": "An independent review examined the project's results.",
        "exampleZh": "一项独立评估审查了这个项目的成果。"
      }
    ],
    "imageQuery": "review report evaluation",
    "scene": "独立人员审查项目成果"
  },
  "hive of activity": {
    "senses": [
      {
        "pos": "n. phrase",
        "en": "A place where many people are busy doing different things.",
        "zh": "忙碌的场所；许多人同时忙于各种活动的地方。",
        "exampleEn": "The library became a hive of activity before the exams.",
        "exampleZh": "考试之前，图书馆成了一个忙碌的场所。"
      }
    ],
    "imageQuery": "busy library students",
    "scene": "图书馆里大家都在忙碌学习"
  },
  "underappreciate": {
    "senses": [
      {
        "pos": "v.",
        "en": "To value or recognize someone or something less than they deserve.",
        "zh": "未充分认可；低估应有的价值或贡献。",
        "exampleEn": "People often underappreciate the work of local volunteers.",
        "exampleZh": "人们常常没有充分认可当地志愿者的工作。"
      }
    ],
    "imageQuery": "community volunteers working",
    "scene": "值得更多认可的志愿者工作"
  },
  "put at": {
    "senses": [
      {
        "pos": "v. phrase",
        "en": "To estimate an amount as a particular number.",
        "zh": "将某一数量估算为；后接估计数值。",
        "exampleEn": "Experts put the cost at around two million dollars.",
        "exampleZh": "专家将费用估算为大约两百万美元。"
      }
    ],
    "imageQuery": "calculator cost estimate",
    "scene": "用一个数值给出估算"
  },
  "primary reasons": {
    "senses": [
      {
        "pos": "n. phrase",
        "en": "The most important causes or explanations for something.",
        "zh": "主要原因；最重要的成因或解释。",
        "exampleEn": "Cost and convenience were the primary reasons for the change.",
        "exampleZh": "成本和便利性是这次改变的主要原因。"
      }
    ],
    "imageQuery": "decision causes diagram",
    "scene": "找出影响决定的主要原因"
  },
  "cultural vibrancy": {
    "senses": [
      {
        "pos": "n. phrase",
        "en": "The lively and diverse character of a place's cultural life.",
        "zh": "文化活力；一个地方文化生活的活跃和多样性。",
        "exampleEn": "Local festivals add to the city's cultural vibrancy.",
        "exampleZh": "当地节庆活动增强了这座城市的文化活力。"
      }
    ],
    "imageQuery": "cultural festival performers",
    "scene": "节庆表演让城市充满文化活力"
  },
  "strive to do": {
    "senses": [
      {
        "pos": "v. phrase",
        "en": "To make a strong effort to take an action or achieve a goal.",
        "zh": "努力做某事；为行动或目标付出很大努力。",
        "exampleEn": "The students strive to improve their reading skills.",
        "exampleZh": "学生们努力提高自己的阅读能力。"
      }
    ],
    "imageQuery": "students studying determined",
    "scene": "为学习目标持续努力"
  }
}
content.update(extra)
content["note"]["imageQuery"] = "public speaking audience"
content["note"]["scene"] = "希望的演讲氛围"
path.write_text(json.dumps(content, ensure_ascii=False, indent=2), encoding="utf-8")
print(len(content), sum(len(entry["senses"]) for entry in content.values()))


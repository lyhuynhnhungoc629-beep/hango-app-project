'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Hospital,
  Lightbulb,
  Mic,
  MicOff,
  Plane,
  RotateCcw,
  SendHorizontal,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  Volume2,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Scenario = {
  id: string
  title: string
  short: string
  icon: LucideIcon
  desc: string
  starterAi: { ko: string; vi: string }
  quickReplies: Array<{ ko: string; vi: string }>
}

const scenarios: Scenario[] = [
  {
    id: 'restaurant',
    title: 'Nhà hàng Hàn Quốc',
    short: 'Nhà hàng',
    icon: UtensilsCrossed,
    desc: 'Gọi món, hỏi giá, yêu cầu thêm nước, thanh toán',
    starterAi: {
      ko: '어서 오세요! 몇 분이세요?',
      vi: 'Xin mời vào! Quý khách đi mấy người ạ?',
    },
    quickReplies: [
      { ko: '두 명이에요.', vi: 'Chúng tôi đi 2 người.' },
      { ko: '메뉴판 좀 보여주세요.', vi: 'Làm ơn cho tôi xem menu.' },
      { ko: '비빔밥 하나, 불고기 하나 주세요.', vi: 'Cho tôi 1 bibimbap và 1 bulgogi.' },
      { ko: '물 좀 더 주세요.', vi: 'Cho tôi xin thêm nước với ạ.' },
      { ko: '계산해 주세요. 카드 돼요?', vi: 'Tính tiền giúp tôi. Có dùng thẻ được không?' },
    ],
  },
  {
    id: 'airport',
    title: 'Sân bay Incheon',
    short: 'Sân bay',
    icon: Plane,
    desc: 'Check-in, ký gửi hành lý, hỏi cửa ra máy bay',
    starterAi: {
      ko: '안녕하세요! 여권과 항공권을 보여주시겠어요?',
      vi: 'Xin chào! Quý khách vui lòng cho xem hộ chiếu và vé máy bay ạ?',
    },
    quickReplies: [
      { ko: '여기 여권과 항공권이에요.', vi: 'Hộ chiếu và vé máy bay của tôi đây ạ.' },
      { ko: '창가 쪽 좌석으로 부탁해요.', vi: 'Làm ơn xếp cho tôi ghế cạnh cửa sổ.' },
      { ko: '수하물은 몇 킬로까지 무료예요?', vi: 'Hành lý ký gửi được miễn phí bao nhiêu kg ạ?' },
      { ko: '탑승구가 어디에 있나요?', vi: 'Cổng lên máy bay nằm ở đâu ạ?' },
    ],
  },
  {
    id: 'shopping',
    title: 'Cửa hàng Mua sắm',
    short: 'Mua sắm',
    icon: ShoppingBag,
    desc: 'Hỏi size, mặc thử đồ, hỏi giá, xin giảm giá',
    starterAi: {
      ko: '어서 오세요! 찾으시는 옷이나 스타일이 있으세요?',
      vi: 'Xin mời vào! Bạn đang tìm loại trang phục hay phong cách nào ạ?',
    },
    quickReplies: [
      { ko: '이거 한번 입어봐도 돼요?', vi: 'Tôi có thể mặc thử cái này được không?' },
      { ko: '더 큰 사이즈나 다른 색상 있나요?', vi: 'Có size lớn hơn hoặc màu khác không ạ?' },
      { ko: '얼마예요? 조금만 깎아 주세요.', vi: 'Cái này bao nhiêu tiền? Bớt cho tôi một chút nhé.' },
      { ko: '이걸로 할게요. 포장해 주세요.', vi: 'Tôi lấy cái này. Gói lại giúp tôi nhé.' },
    ],
  },
  {
    id: 'hospital',
    title: 'Bệnh viện & Hiệu thuốc',
    short: 'Bệnh viện',
    icon: Hospital,
    desc: 'Mô tả triệu chứng, khám bệnh, hỏi cách uống thuốc',
    starterAi: {
      ko: '어디가 불편해서 오셨나요? 증상을 말씀해 주세요.',
      vi: 'Bạn cảm thấy không khỏe ở đâu ạ? Hãy mô tả triệu chứng nhé.',
    },
    quickReplies: [
      { ko: '어제부터 머리가 아프고 열이 나요.', vi: 'Từ hôm qua tôi bị đau đầu và sốt.' },
      { ko: '목이 따갑고 기침이 심해요.', vi: 'Cổ họng tôi bị rát và ho nhiều.' },
      { ko: '배가 아프고 소화가 잘 안 돼요.', vi: 'Tôi bị đau bụng và khó tiêu.' },
      { ko: '이 약은 하루에 몇 번 먹어야 하나요?', vi: 'Thuốc này mỗi ngày uống mấy lần ạ?' },
    ],
  },
]

type Message =
  | { id: string; role: 'ai'; ko: string; vi: string }
  | { id: string; role: 'user'; ko: string }
  | { id: string; role: 'tip'; text: string; wrong: string; right: string }

// Bộ máy phản hồi đối thoại mô phỏng thông minh theo ngữ cảnh (dùng khi Backend Microservice chưa online)
function generateContextualResponse(
  scenarioId: string,
  userText: string,
): { response: { ko: string; vi: string }; tip?: { text: string; wrong: string; right: string } } {
  const text = userText.trim().toLowerCase()
  let tip: { text: string; wrong: string; right: string } | undefined

  // 1. Kiểm tra mẹo ngữ pháp / xưng hô lịch sự
  if (text.includes('주어요')) {
    tip = {
      text: 'Khi yêu cầu lịch sự trong giao tiếp thực tế, hãy dùng đuôi -주세요.',
      wrong: '주어요',
      right: '주세요',
    }
  } else if (text.endsWith('줘') || text.endsWith('줘라')) {
    tip = {
      text: 'Khi nói chuyện với nhân viên dịch vụ, hãy dùng đuôi kính ngữ 존댓말 (-주세요) thay vì 반말.',
      wrong: '줘',
      right: '주세요',
    }
  } else if (text.includes('얼마야')) {
    tip = {
      text: 'Nên dùng "얼마예요?" thay vì "얼마야" để thể hiện phép lịch sự.',
      wrong: '얼마야',
      right: '얼마예요?',
    }
  } else if (text.startsWith('나 ') || text.startsWith('나는 ')) {
    tip = {
      text: 'Trong ngữ cảnh lịch sự, hãy xưng là "저/저는" thay vì "나/나는".',
      wrong: '나',
      right: '저',
    }
  }

  // 2. Phản hồi theo từng kịch bản
  if (scenarioId === 'restaurant') {
    if (text.includes('명') || text.includes('사람') || text.includes('혼자')) {
      return {
        response: {
          ko: '네, 이쪽 편안한 자리로 앉으세요. 메뉴판 준비해 드릴게요.',
          vi: 'Vâng, mời quý khách ngồi vào bàn thoải mái phía bên này. Tôi sẽ chuẩn bị menu ngay ạ.',
        },
        tip,
      }
    }
    if (text.includes('메뉴') || text.includes('추천')) {
      return {
        response: {
          ko: '저희 식당은 비빔밥과 김치찌개가 가장 인기가 많습니다. 무엇으로 드릴까요?',
          vi: 'Nhà hàng chúng tôi món cơm trộn bibimbap và canh kim chi là được ưa chuộng nhất. Quý khách muốn dùng món nào ạ?',
        },
        tip,
      }
    }
    if (text.includes('주세요') || text.includes('주문') || text.includes('밥') || text.includes('불고기') || text.includes('비빔밥')) {
      return {
        response: {
          ko: '네, 주문 확인했습니다! 정성껏 요리해서 곧 가져다드릴게요. 잠시만 기다려 주세요.',
          vi: 'Vâng, tôi đã xác nhận món! Chúng tôi sẽ chuẩn bị thật chu đáo và mang lên ngay. Xin quý khách đợi một chút ạ.',
        },
        tip,
      }
    }
    if (text.includes('물') || text.includes('반찬')) {
      return {
        response: {
          ko: '네, 시원한 물과 추가 반찬 바로 가져다드리겠습니다!',
          vi: 'Vâng, tôi sẽ mang ngay nước mát và đồ ăn kèm thêm cho quý khách ạ!',
        },
        tip,
      }
    }
    if (text.includes('계산') || text.includes('얼마') || text.includes('카드') || text.includes('돈')) {
      return {
        response: {
          ko: '네, 총 18,000원입니다. 신용카드와 현금 모두 결제 가능하세요!',
          vi: 'Vâng, tổng cộng là 18.000 won. Có thể thanh toán bằng cả thẻ tín dụng và tiền mặt ạ!',
        },
        tip,
      }
    }
    return {
      response: {
        ko: '네, 잘 알겠습니다. 식사는 입에 맞으셨나요? 필요한 것이 있으시면 언제든 말씀해 주세요.',
        vi: 'Vâng, tôi hiểu rồi ạ. Món ăn có hợp khẩu vị của quý khách không? Nếu cần gì thêm xin cứ gọi nhé.',
      },
      tip,
    }
  }

  if (scenarioId === 'airport') {
    if (text.includes('여권') || text.includes('여기')) {
      return {
        response: {
          ko: '확인 감사합니다. 부치실 짐이 있으신가요? 수하물을 저울 위에 올려주세요.',
          vi: 'Cảm ơn quý khách đã xác nhận. Quý khách có hành lý ký gửi không ạ? Vui lòng đặt hành lý lên cân.',
        },
        tip,
      }
    }
    if (text.includes('창가') || text.includes('좌석') || text.includes('자리') || text.includes('복도')) {
      return {
        response: {
          ko: '네, 요청하신 창가 쪽 좌석 23A로 배정해 드렸습니다. 편안한 비행 되세요!',
          vi: 'Vâng, tôi đã xếp chỗ ngồi 23A cạnh cửa sổ theo yêu cầu của quý khách. Chúc quý khách có chuyến bay dễ chịu!',
        },
        tip,
      }
    }
    if (text.includes('수하물') || text.includes('짐') || text.includes('무게') || text.includes('킬로')) {
      return {
        response: {
          ko: '일반석 기준 23kg 이하 1개까지 무료 위탁 가능합니다.',
          vi: 'Theo tiêu chuẩn hạng phổ thông, được miễn phí 1 kiện hành lý từ 23kg trở xuống ạ.',
        },
        tip,
      }
    }
    if (text.includes('탑승구') || text.includes('어디') || text.includes('게이트')) {
      return {
        response: {
          ko: '탑승구는 12번 게이트입니다. 출발 30분 전까지 탑승해 주시기 바랍니다.',
          vi: 'Cổng lên máy bay là Gate số 12. Quý khách vui lòng có mặt tại cửa trước giờ khởi hành 30 phút nhé.',
        },
        tip,
      }
    }
    return {
      response: {
        ko: '네, 탑승 수속이 모두 완료되었습니다. 즐겁고 안전한 여행 되세요!',
        vi: 'Vâng, thủ tục lên máy bay đã hoàn tất. Chúc quý khách có chuyến đi vui vẻ và an toàn!',
      },
      tip,
    }
  }

  if (scenarioId === 'shopping') {
    if (text.includes('입어') || text.includes('입어봐') || text.includes('피팅')) {
      return {
        response: {
          ko: '네, 저쪽에 피팅룸이 준비되어 있습니다. 편하게 입어보세요!',
          vi: 'Vâng, phòng thử đồ ở phía đằng kia ạ. Mời bạn cứ mặc thử thoải mái nhé!',
        },
        tip,
      }
    }
    if (text.includes('사이즈') || text.includes('크') || text.includes('작') || text.includes('색')) {
      return {
        response: {
          ko: '잠시만요, 창고에서 한 치수 더 큰 사이즈와 다른 색상을 찾아봐 드릴게요.',
          vi: 'Xin đợi một chút, tôi sẽ vào kho tìm size lớn hơn và màu khác cho bạn xem nhé.',
        },
        tip,
      }
    }
    if (text.includes('얼마') || text.includes('깎') || text.includes('할인') || text.includes('싸게')) {
      return {
        response: {
          ko: '원래 35,000원인데 현금 결제하시면 10% 할인해서 31,500원에 드릴게요!',
          vi: 'Giá gốc là 35.000 won, nếu bạn thanh toán bằng tiền mặt thì được giảm 10% còn 31.500 won nhé!',
        },
        tip,
      }
    }
    return {
      response: {
        ko: '네, 아주 잘 어울리세요! 카운터에서 예쁘게 포장해 드리겠습니다.',
        vi: 'Vâng, bạn mặc trông rất hợp luôn! Tôi sẽ gói lại thật đẹp tại quầy thu ngân nhé.',
      },
      tip,
    }
  }

  // Hospital
  if (text.includes('머리') || text.includes('열') || text.includes('아프')) {
    return {
      response: {
        ko: '열이 좀 있으시네요. 체온을 재고 의사 선생님 진료를 받으시겠습니다. 이쪽으로 오세요.',
        vi: 'Bạn hơi sốt rồi đấy. Chúng ta sẽ đo nhiệt độ trước rồi vào gặp bác sĩ khám nhé. Mời bạn đi lối này.',
      },
      tip,
    }
  }
  if (text.includes('목') || text.includes('기침') || text.includes('감기')) {
    return {
      response: {
        ko: '환절기 감기 증상으로 보입니다. 따뜻한 물을 자주 드시고 목을 보호하세요.',
        vi: 'Có vẻ bạn bị cảm cúm do thay đổi thời tiết. Hãy uống nước ấm thường xuyên và giữ ấm cổ nhé.',
      },
      tip,
    }
  }
  if (text.includes('약') || text.includes('먹') || text.includes('하루')) {
    return {
      response: {
        ko: '이 약은 식사 후 30분에 하루 세 번, 물과 함께 복용하시면 됩니다. 졸릴 수 있으니 운전은 조심하세요.',
        vi: 'Thuốc này uống 3 lần một ngày sau bữa ăn 30 phút với nước lọc. Thuốc có thể gây buồn ngủ nên bạn chú ý khi lái xe nhé.',
      },
      tip,
    }
  }

  return {
    response: {
      ko: '네, 증상을 잘 메모해 두었습니다. 진료실 안으로 들어가시면 의사 선생님께서 자세히 봐주실 거예요.',
      vi: 'Vâng, tôi đã ghi lại triệu chứng rồi. Khi vào phòng khám, bác sĩ sẽ kiểm tra kỹ lưỡng cho bạn nhé.',
    },
    tip,
  }
}

export function RoleplayChat() {
  const [active, setActive] = useState('restaurant')
  const currentScenario = scenarios.find((s) => s.id === active) || scenarios[0]

  // Khởi tạo tin nhắn ban đầu theo tình huống được chọn
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      role: 'ai',
      ko: currentScenario.starterAi.ko,
      vi: currentScenario.starterAi.vi,
    },
  ])
  const [draft, setDraft] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speechError, setSpeechError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const recognitionRef = useRef<any>(null)

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Khi đổi tình huống: nạp lời chào mới của AI tương ứng
  const handleSelectScenario = (id: string) => {
    setActive(id)
    const sc = scenarios.find((s) => s.id === id) || scenarios[0]
    setMessages([
      {
        id: `init-${id}`,
        role: 'ai',
        ko: sc.starterAi.ko,
        vi: sc.starterAi.vi,
      },
    ])
    setDraft('')
    setSpeechError(null)
  }

  // Khởi động lại cuộc trò chuyện hiện tại
  const handleResetChat = () => {
    setMessages([
      {
        id: `reset-${Date.now()}`,
        role: 'ai',
        ko: currentScenario.starterAi.ko,
        vi: currentScenario.starterAi.vi,
      },
    ])
    setDraft('')
    setSpeechError(null)
  }

  // Phát âm tiếng Hàn câu thoại qua Web Speech Synthesis
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()

    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'ko-KR'
    utter.rate = 0.9

    const voices = window.speechSynthesis.getVoices()
    const koVoice =
      voices.find(
        (v) =>
          v.lang.startsWith('ko') &&
          (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Heami')),
      ) || voices.find((v) => v.lang.startsWith('ko'))

    if (koVoice) utter.voice = koVoice
    window.speechSynthesis.speak(utter)
  }

  // Nhận diện giọng nói tiếng Hàn qua Web Speech Recognition
  const toggleSpeechRecognition = () => {
    setSpeechError(null)

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    if (typeof window === 'undefined') return
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setSpeechError('Trình duyệt chưa hỗ trợ nhận diện giọng nói. Hãy dùng Chrome hoặc Edge nhé!')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'ko-KR'
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript
        }
        if (transcript) {
          setDraft(transcript)
        }
      }

      recognition.onerror = (event: any) => {
        setIsListening(false)
        if (event.error === 'not-allowed') {
          setSpeechError('Vui lòng cấp quyền truy cập Micro trên trình duyệt để nói tiếng Hàn.')
        } else if (event.error !== 'no-speech') {
          setSpeechError(`Lỗi nhận diện âm thanh: ${event.error}`)
        }
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch {
      setIsListening(false)
    }
  }

  // Gửi tin nhắn và nhận phản hồi AI
  const send = async (explicitText?: string) => {
    const textToSend = (explicitText !== undefined ? explicitText : draft).trim()
    if (!textToSend || isTyping) return

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    }

    const userMsgId = `user-${Date.now()}`
    setMessages((prev) => [...prev, { id: userMsgId, role: 'user', ko: textToSend }])
    setDraft('')
    setIsTyping(true)

    // Thử gọi API Backend nếu có sẵn, nếu chưa có thì dùng bộ máy phản hồi ngữ cảnh cục bộ
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: active,
          message: textToSend,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.reply) {
          if (data.tip) {
            setMessages((prev) => [
              ...prev,
              {
                id: `tip-${Date.now()}`,
                role: 'tip',
                text: data.tip.text,
                wrong: data.tip.wrong,
                right: data.tip.right,
              },
            ])
          }
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              role: 'ai',
              ko: data.reply.ko,
              vi: data.reply.vi,
            },
          ])
          setIsTyping(false)
          return
        }
      }
    } catch {
      // Khi API chưa dựng hoặc lỗi mạng, tự động chuyển sang mô phỏng mượt mà
    }

    // Mô phỏng độ trễ suy nghĩ của AI (600ms - 1000ms) tạo cảm giác trò chuyện thật
    setTimeout(() => {
      const { response, tip } = generateContextualResponse(active, textToSend)

      setMessages((prev) => {
        const nextList = [...prev]
        if (tip) {
          nextList.push({
            id: `tip-${Date.now()}`,
            role: 'tip',
            text: tip.text,
            wrong: tip.wrong,
            right: tip.right,
          })
        }
        nextList.push({
          id: `ai-${Date.now()}`,
          role: 'ai',
          ko: response.ko,
          vi: response.vi,
        })
        return nextList
      })
      setIsTyping(false)
    }, 750)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[290px_1fr]">
      {/* CỘT TRÁI: DANH SÁCH TÌNH HUỐNG */}
      <section aria-labelledby="scenario-title" className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-4 shadow-[0_2px_0_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h2 id="scenario-title" className="text-sm font-black tracking-tight text-slate-900">
            Tình huống giao tiếp
          </h2>
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-bold text-[#7C3AED]">
            {scenarios.length} chủ đề
          </span>
        </div>

        <ul className="mt-3.5 space-y-2.5">
          {scenarios.map(({ id, title, icon: Icon, desc }) => (
            <li key={id}>
              <button
                type="button"
                aria-pressed={active === id}
                onClick={() => handleSelectScenario(id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all',
                  active === id
                    ? 'border-[1.5px] border-slate-900 bg-[#7C3AED] text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50/60 hover:border-slate-400 hover:bg-slate-100 text-slate-800',
                )}
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                    active === id ? 'bg-white/20 text-white' : 'border border-slate-200 bg-white text-slate-600',
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className={cn('block text-xs font-bold leading-tight', active === id ? 'text-white' : 'text-slate-900')}>
                    {title}
                  </span>
                  <span className={cn('mt-1 block text-[11px] leading-snug line-clamp-2', active === id ? 'text-white/80' : 'text-slate-500')}>
                    {desc}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/70 p-3 text-[11px] leading-relaxed text-slate-700">
          <div className="flex items-center gap-1.5 font-bold text-[#7C3AED]">
            <Sparkles className="size-3.5" />
            <span>AI Feedback thời gian thực</span>
          </div>
          <p className="mt-1">
            AI sẽ đối thoại bằng tiếng Hàn tự nhiên và tự động gợi ý sửa lỗi kính ngữ hoặc cấu trúc ngữ pháp.
          </p>
        </div>
      </section>

      {/* CỘT PHẢI: KHUNG CHAT TRÒ CHUYỆN */}
      <section
        aria-label="Hội thoại"
        className="flex h-[660px] flex-col overflow-hidden rounded-2xl border-[1.5px] border-slate-800 bg-white shadow-[0_2px_0_rgba(15,23,42,0.06)]"
      >
        {/* HEADER KHUNG CHAT */}
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <span className="relative flex size-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-300">
              <svg viewBox="0 0 36 24" className="h-4.5 w-6" aria-hidden="true">
                <circle cx="18" cy="12" r="5" fill="#cd2e3a" />
                <path d="M13 12a5 5 0 0 0 10 0 2.5 2.5 0 0 0-5 0 2.5 2.5 0 0 1-5 0Z" fill="#0047a0" />
              </svg>
              <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-emerald-500" />
            </span>
            <div>
              <p className="text-sm font-black text-slate-900">Trợ lý AI HANGO · {currentScenario.short}</p>
              <p className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Sẵn sàng hội thoại tiếng Hàn trực tuyến
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetChat}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs"
            title="Làm mới cuộc trò chuyện"
          >
            <RotateCcw className="size-3.5" />
            <span className="hidden sm:inline">Hội thoại mới</span>
          </button>
        </header>

        {/* NỘI DUNG TIN NHẮN */}
        <ol className="flex flex-1 flex-col gap-4 overflow-y-auto p-5 bg-[#FAFBFD]" aria-live="polite">
          {messages.map((m) => {
            if (m.role === 'ai') {
              return (
                <li
                  key={m.id}
                  className="group relative max-w-[85%] self-start rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-4 text-slate-900 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p lang="ko" className="text-base font-bold leading-relaxed text-slate-900">
                        {m.ko}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 leading-normal">{m.vi}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => speakText(m.ko)}
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
                      title="Nghe phát âm"
                      aria-label="Phát âm tiếng Hàn"
                    >
                      <Volume2 className="size-4" />
                    </button>
                  </div>
                </li>
              )
            }

            if (m.role === 'user') {
              return (
                <li
                  key={m.id}
                  className="group relative max-w-[80%] self-end rounded-2xl rounded-tr-sm border border-slate-900 bg-[#7C3AED] p-3.5 text-white shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <p lang="ko" className="text-base font-bold leading-relaxed">
                      {m.ko}
                    </p>
                    <button
                      type="button"
                      onClick={() => speakText(m.ko)}
                      className="flex size-6 shrink-0 items-center justify-center rounded-md text-white/80 hover:bg-white/20 hover:text-white transition"
                      title="Nghe lại phát âm"
                      aria-label="Nghe lại phát âm câu của bạn"
                    >
                      <Volume2 className="size-3.5" />
                    </button>
                  </div>
                </li>
              )
            }

            return (
              <li
                key={m.id}
                className="flex max-w-[90%] gap-3 self-end rounded-xl border border-amber-400 bg-amber-50 p-3.5 text-xs text-slate-900 shadow-sm"
              >
                <Lightbulb className="size-4.5 shrink-0 text-amber-600 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-bold text-amber-900">Gợi ý sửa lỗi ngữ pháp & xưng hô</p>
                  <p className="mt-1 text-slate-700 leading-relaxed">
                    Nên dùng{' '}
                    <span
                      lang="ko"
                      className="rounded border border-emerald-400 bg-emerald-100 px-1.5 py-0.5 font-bold text-emerald-900"
                    >
                      {m.right}
                    </span>{' '}
                    thay vì{' '}
                    <span
                      lang="ko"
                      className="rounded border border-red-300 bg-red-100 px-1.5 py-0.5 font-semibold text-red-700 line-through"
                    >
                      {m.wrong}
                    </span>
                    . {m.text}
                  </p>
                </div>
              </li>
            )
          })}

          {/* HIỆU ỨNG AI ĐANG SOẠN TIN NHẮN */}
          {isTyping && (
            <li className="flex max-w-[80%] items-center gap-2 self-start rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
              <span className="flex gap-1">
                <span className="size-2 rounded-full bg-[#7C3AED] animate-bounce [animation-delay:-0.3s]" />
                <span className="size-2 rounded-full bg-[#7C3AED] animate-bounce [animation-delay:-0.15s]" />
                <span className="size-2 rounded-full bg-[#7C3AED] animate-bounce" />
              </span>
              <span>AI đang suy nghĩ phản hồi...</span>
            </li>
          )}

          <div ref={messagesEndRef} />
        </ol>

        {/* CÁC GỢI Ý MẪU CÂU NHANH (QUICK REPLIES) */}
        <div className="border-t border-slate-200 bg-white px-4 py-2.5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="shrink-0 text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Sparkles className="size-3 text-[#7C3AED]" />
              Gợi ý nói:
            </span>
            {currentScenario.quickReplies.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => send(q.ko)}
                className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-800 hover:bg-violet-50 hover:text-[#7C3AED] transition shadow-2xs"
                title={q.vi}
              >
                {q.ko}
              </button>
            ))}
          </div>
        </div>

        {/* THÔNG BÁO LỖI MICRO NẾU CÓ */}
        {speechError && (
          <div className="bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 border-t border-red-200">
            {speechError}
          </div>
        )}

        {/* KHUNG NHẬP TIN NHẮN & NÚT MICRO */}
        <form
          className="flex items-center gap-2.5 border-t border-slate-200 p-3.5 bg-white"
          onSubmit={(e) => {
            e.preventDefault()
            void send()
          }}
        >
          {/* NÚT THU ÂM BẰNG GIỌNG NÓI */}
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            aria-label={isListening ? 'Dừng ghi âm' : 'Nói tiếng Hàn'}
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-xl transition-all',
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30 ring-2 ring-red-400'
                : 'border border-slate-300 bg-slate-50 text-slate-600 hover:border-slate-800 hover:text-slate-900 hover:bg-slate-100',
            )}
            title={isListening ? 'Đang lắng nghe... bấm để dừng' : 'Bấm để nói tiếng Hàn (Micro)'}
          >
            {isListening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
          </button>

          <label htmlFor="chat-input" className="sr-only">
            Nhập tiếng Hàn
          </label>
          <input
            id="chat-input"
            lang="ko"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) {
                e.preventDefault()
              }
            }}
            placeholder={isListening ? 'Đang lắng nghe bạn nói tiếng Hàn...' : 'Nhập câu tiếng Hàn hoặc bấm Micro...'}
            className="h-11 flex-1 rounded-xl border border-slate-300 bg-slate-50/70 px-4 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none transition"
          />

          <button
            type="submit"
            disabled={!draft.trim() || isTyping}
            aria-label="Gửi"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-slate-900 bg-[#7C3AED] text-white transition hover:bg-[#6D28D9] disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_2px_0_rgba(15,23,42,0.1)]"
          >
            <SendHorizontal className="size-5" aria-hidden="true" />
          </button>
        </form>
      </section>
    </div>
  )
}

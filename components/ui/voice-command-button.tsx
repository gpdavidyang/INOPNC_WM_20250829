'use client'


interface VoiceCommandButtonProps {
  onCommand?: (command: string) => void
  onError?: (error: string) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Korean voice commands for construction work
const KOREAN_COMMANDS = {
  '시작': 'start',
  '완료': 'complete', 
  '저장': 'save',
  '취소': 'cancel',
  '다음': 'next',
  '이전': 'previous',
  '확인': 'confirm',
  '삭제': 'delete',
  '편집': 'edit',
  '새로운': 'new',
  '작업일지': 'work-log',
  '안전점검': 'safety-check',
  '품질관리': 'quality-control',
  '자재관리': 'material-management',
  '도움말': 'help',
  '홈': 'home'
} as const

export function VoiceCommandButton({
  onCommand,
  onError,
  disabled = false,
  size = 'md',
  className
}: VoiceCommandButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognition = useRef<unknown>(null)

  useEffect(() => {
    // Check if Web Speech API is supported
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || (window as unknown).webkitSpeechRecognition
      if (SpeechRecognition) {
        setIsSupported(true)
        recognition.current = new SpeechRecognition()
        
        // Configure for Korean language
        recognition.current.lang = 'ko-KR'
        recognition.current.continuous = false
        recognition.current.interimResults = false
        recognition.current.maxAlternatives = 1

        recognition.current.onstart = () => {
          setIsListening(true)
        }

        recognition.current.onend = () => {
          setIsListening(false)
        }

        recognition.current.onresult = (event: unknown) => {
          const transcript = event.results[0][0].transcript.trim()
          
          // Find matching Korean command
          const command = KOREAN_COMMANDS[transcript as keyof typeof KOREAN_COMMANDS]
          
          if (command) {
            onCommand?.(command)
            // Provide audio feedback
            playSuccessSound()
          } else {
            onError?.(`인식되지 않은 명령어: "${transcript}"`)
            // Provide error audio feedback
            playErrorSound()
          }
        }

        recognition.current.onerror = (event: unknown) => {
          setIsListening(false)
          onError?.(`음성 인식 오류: ${event.error}`)
          playErrorSound()
        }
      }
    }

    return () => {
      if (recognition.current) {
        recognition.current.stop()
      }
    }
  }, [onCommand, onError])

  const playSuccessSound = () => {
    // Create a simple success beep
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      const audioContext = new AudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
    }
  }

  const playErrorSound = () => {
    // Create a simple error beep
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      const audioContext = new AudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    }
  }

  const toggleListening = () => {
    if (!recognition.current || disabled) return

    if (isListening) {
      recognition.current.stop()
    } else {
      try {
        recognition.current.start()
      } catch (error) {
        onError?.('음성 인식을 시작할 수 없습니다.')
      }
    }
  }

  const buttonClasses = cn(
    'relative inline-flex items-center justify-center rounded-full',
    'transition-all duration-200 border-2',
    'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'active:scale-95',
    
    // Size variants
    {
      'h-10 w-10 border-gray-300': size === 'sm',
      'h-12 w-12 border-gray-300': size === 'md',
      'h-14 w-14 border-gray-400': size === 'lg',
    },

    // State variants
    isListening 
      ? 'bg-red-500 hover:bg-red-600 border-red-600 text-white animate-pulse'
      : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700',

    // Weather resistance
    'shadow-lg min-h-[48px] min-w-[48px]',
    
    className
  )

  if (!isSupported) {
    return (
      <div 
        className={cn(buttonClasses, 'cursor-not-allowed opacity-50')}
        title="이 브라우저에서는 음성 인식이 지원되지 않습니다"
      >
        <MicOff className="h-5 w-5" />
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={toggleListening}
        disabled={disabled}
        className={buttonClasses}
        aria-label={isListening ? '음성 인식 중지' : '음성 인식 시작'}
        aria-pressed={isListening}
        title={
          isListening 
            ? '음성 명령을 듣고 있습니다. 클릭하여 중지하세요.' 
            : '음성 명령을 시작하려면 클릭하세요.'
        }
      >
        {isListening ? (
          <Mic className="h-5 w-5" />
        ) : (
          <MicOff className="h-5 w-5" />
        )}
        
        {/* Visual feedback for listening state */}
        {isListening && (
          <span 
            className="absolute inset-0 rounded-full bg-red-500/30 animate-ping"
            aria-hidden="true"
          />
        )}
      </button>

      {/* Command suggestions tooltip */}
      {isListening && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-md whitespace-nowrap z-50">
          <div className="text-center">
            <p className="font-semibold mb-1">사용 가능한 명령어:</p>
            <p>&quot;시작&quot;, &quot;완료&quot;, &quot;저장&quot;, &quot;취소&quot;</p>
            <p>&quot;작업일지&quot;, &quot;안전점검&quot;, &quot;품질관리&quot;</p>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
        </div>
      )}
    </div>
  )
}
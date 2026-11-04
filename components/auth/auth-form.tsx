'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

type Tab = 'login' | 'register'
type SocialProvider = 'google' | 'facebook' | 'apple'

function Field({
  id,
  label,
  type,
  placeholder,
  icon: Icon,
  autoComplete,
  value,
  onChange,
  trailing,
}: {
  id: string
  label: string
  type: string
  placeholder: string
  icon: typeof Mail
  autoComplete: string
  value: string
  onChange: (value: string) => void
  trailing?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-white/80">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          id={id}
          name={id}
          type={type}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-12 w-full rounded-xl border border-white/10 bg-field pl-12 pr-12 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {trailing}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.026 4.388 11.021 10.125 11.927v-8.437H7.078v-3.49h3.047V9.413c0-3.026 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
      />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0 fill-current" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}

function translateFirebaseError(err: unknown): string {
  if (err instanceof Error && err.message === 'FIREBASE_NOT_CONFIGURED') {
    return 'Dự án chưa điền thông số cấu hình Firebase trong file .env.local. Vui lòng dán cấu hình từ dự án HangoApp trên Firebase Console.'
  }

  const code = (err as { code?: string })?.code || ''
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email hoặc mật khẩu không chính xác.'
    case 'auth/email-already-in-use':
      return 'Email này đã được đăng ký. Vui lòng chuyển sang Đăng nhập.'
    case 'auth/weak-password':
      return 'Mật khẩu quá yếu. Vui lòng nhập ít nhất 6 ký tự.'
    case 'auth/invalid-email':
      return 'Địa chỉ email không hợp lệ.'
    case 'auth/popup-closed-by-user':
      return 'Bạn đã đóng cửa sổ đăng nhập trước khi hoàn tất.'
    case 'auth/account-exists-with-different-credential':
      return 'Email này đã liên kết với một phương thức đăng nhập khác.'
    case 'auth/operation-not-allowed':
      return 'Phương thức đăng nhập này chưa được bật trong mục Authentication -> Sign-in method trên Firebase Console.'
    case 'auth/too-many-requests':
      return 'Quá nhiều lần thử không thành công. Vui lòng thử lại sau ít phút.'
    default:
      return (err as Error)?.message || 'Đã xảy ra lỗi khi xác thực. Vui lòng thử lại.'
  }
}

export function AuthForm({ initialTab }: { initialTab: Tab }) {
  const router = useRouter()
  const {
    isConfigured,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginWithFacebook,
    loginWithApple,
    sendResetPassword,
  } = useAuth()

  const [tab, setTab] = useState<Tab>(initialTab)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const isLogin = tab === 'login'
  const busy = submitting || socialLoading !== null

  const switchTab = (nextTab: Tab) => {
    setTab(nextTab)
    setError(null)
    setMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!isLogin) {
      if (password.length < 6) {
        setError('Mật khẩu phải có ít nhất 6 ký tự.')
        return
      }
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp.')
        return
      }
    }

    setSubmitting(true)
    try {
      if (isLogin) {
        await loginWithEmail(email, password)
      } else {
        await registerWithEmail(name, email, password)
      }
      router.push('/')
    } catch (err) {
      setError(translateFirebaseError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSocialLogin = async (provider: SocialProvider) => {
    setError(null)
    setMessage(null)
    setSocialLoading(provider)
    try {
      if (provider === 'google') await loginWithGoogle()
      if (provider === 'facebook') await loginWithFacebook()
      if (provider === 'apple') await loginWithApple()
      router.push('/')
    } catch (err) {
      setError(translateFirebaseError(err))
    } finally {
      setSocialLoading(null)
    }
  }

  const handleForgotPassword = async () => {
    setError(null)
    setMessage(null)
    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ Email ở ô bên trên để nhận liên kết đặt lại mật khẩu.')
      return
    }
    setSubmitting(true)
    try {
      await sendResetPassword(email.trim())
      setMessage('Đã gửi email đặt lại mật khẩu! Vui lòng kiểm tra hộp thư của bạn.')
    } catch (err) {
      setError(translateFirebaseError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground"
    >
      {showPassword ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
    </button>
  )

  return (
    <div className="w-full max-w-md">
      <div role="tablist" aria-label="Chọn hình thức" className="grid grid-cols-2 rounded-xl border border-white/10 bg-field p-1">
        {(['login', 'register'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => switchTab(t)}
            className={cn(
              'h-10 rounded-lg text-sm font-semibold transition-colors',
              tab === t ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        ))}
      </div>

      {!isConfigured && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs leading-relaxed text-amber-200">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden="true" />
          <div>
            <p className="font-semibold text-amber-300">Chưa điền khóa cấu hình Firebase (.env.local)</p>
            <p className="mt-0.5 text-amber-200/80">
              Vui lòng mở dự án <strong>HangoApp</strong> trên Firebase Console, copy bộ mã <code>firebaseConfig</code> vào file <code>.env.local</code> để kích hoạt đăng nhập thật.
            </p>
          </div>
        </div>
      )}

      <h1 className="mt-8 text-3xl font-bold">{isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {isLogin ? 'Chào mừng bạn quay lại! 다시 만나서 반가워요.' : 'Bắt đầu hành trình học tiếng Hàn miễn phí.'}
      </p>

      {error && (
        <div role="alert" className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-sm text-red-200">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-400" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div role="status" className="mt-5 flex items-start gap-2.5 rounded-xl border border-green-500/40 bg-green-500/10 p-3.5 text-sm text-green-200">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-400" aria-hidden="true" />
          <span>{message}</span>
        </div>
      )}

      <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
        {!isLogin && (
          <Field
            id="name"
            label="Họ và tên"
            type="text"
            placeholder="Nguyễn Văn A"
            icon={User}
            autoComplete="name"
            value={name}
            onChange={setName}
          />
        )}
        <Field
          id="email"
          label="Email"
          type="email"
          placeholder="ban@email.com"
          icon={Mail}
          autoComplete="email"
          value={email}
          onChange={setEmail}
        />
        <Field
          id="password"
          label="Mật khẩu"
          type={showPassword ? 'text' : 'password'}
          placeholder={isLogin ? 'Nhập mật khẩu' : 'Tối thiểu 6 ký tự'}
          icon={Lock}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          value={password}
          onChange={setPassword}
          trailing={passwordToggle}
        />
        {!isLogin && (
          <Field
            id="confirm-password"
            label="Xác nhận mật khẩu"
            type={showPassword ? 'text' : 'password'}
            placeholder="Nhập lại mật khẩu"
            icon={Lock}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
          />
        )}
        {isLogin && (
          <div className="-mt-1 flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={busy}
              className="text-sm font-medium text-violet-400 hover:text-violet-300 disabled:opacity-50"
            >
              Quên mật khẩu?
            </button>
          </div>
        )}
        <button
          type="submit"
          disabled={busy}
          className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-white shadow-lg shadow-primary/30 transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
          {isLogin ? 'Đăng nhập' : 'Đăng ký tài khoản'}
        </button>
      </form>

      <div className="my-6 flex items-center gap-4" role="separator">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">hoặc tiếp tục với</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => handleSocialLogin('google')}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/20 bg-field font-semibold transition-colors hover:border-white/50 hover:bg-white hover:text-[#0F0F1A] disabled:opacity-60"
        >
          {socialLoading === 'google' ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <GoogleIcon />}
          Tiếp tục với Google
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => handleSocialLogin('facebook')}
            className="flex h-12 items-center justify-center gap-2.5 rounded-xl border border-white/20 bg-field px-4 text-sm font-semibold transition-colors hover:border-[#1877F2] hover:bg-[#1877F2]/15 disabled:opacity-60"
          >
            {socialLoading === 'facebook' ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <FacebookIcon />}
            Facebook
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => handleSocialLogin('apple')}
            className="flex h-12 items-center justify-center gap-2.5 rounded-xl border border-white/20 bg-field px-4 text-sm font-semibold transition-colors hover:border-white/60 hover:bg-white hover:text-[#0F0F1A] disabled:opacity-60"
          >
            {socialLoading === 'apple' ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <AppleIcon />}
            Apple
          </button>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
        <button
          type="button"
          onClick={() => switchTab(isLogin ? 'register' : 'login')}
          className="font-semibold text-violet-400 hover:text-violet-300"
        >
          {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
        </button>
      </p>
    </div>
  )
}

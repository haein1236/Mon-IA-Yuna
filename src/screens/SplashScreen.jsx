import AIAvatar from '../components/AIAvatar'

function SplashScreen() {
  return (
    <div className="min-h-screen bg-espresso flex flex-col items-center justify-center gap-6">
      
      <div className="animate-bounce">
        <AIAvatar size={112} />
      </div>

      <h1 className="text-peony text-3xl font-bold tracking-wide">
        Yuna
      </h1>

      <p className="text-peony-light text-sm opacity-70">
        Ta pote IA t'attend...
      </p>
    </div>
  )
}

export default SplashScreen
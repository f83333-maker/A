import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#131314]">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-[#e3e3e3] mb-8">隐私政策</h1>
          
          <div className="space-y-6 text-[#9aa0a6] text-[14px] leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-[#e3e3e3] mb-3">1. 信息收集</h2>
              <p>我们仅收集您在下单时提供的必要信息，包括联系方式和查询密码。这些信息用于订单处理和客户服务。</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#e3e3e3] mb-3">2. 信息使用</h2>
              <p>您的信息仅用于：处理订单、提供客户支持、发送订单相关通知。我们不会将您的信息出售或分享给第三方。</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#e3e3e3] mb-3">3. 信息安全</h2>
              <p>我们采取技术措施保护您的信息安全，包括对敏感信息进行加密存储。查询密码经过哈希处理后存储。</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#e3e3e3] mb-3">4. Cookie 使用</h2>
              <p>本网站可能使用 Cookie 来改善用户体验。您可以通过浏览器设置管理 Cookie 偏好。</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#e3e3e3] mb-3">5. 联系我们</h2>
              <p>如对隐私政策有任何疑问，请通过网站提供的联系方式与我们联系。</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

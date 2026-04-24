import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#131314]">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-[#e3e3e3] mb-8">服务条款</h1>
          
          <div className="space-y-6 text-[#9aa0a6] text-[14px] leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-[#e3e3e3] mb-3">1. 服务说明</h2>
              <p>CHUHAIZIYUAN 是一个账号批发服务平台，提供各类账号的批发销售服务。使用本平台服务即表示您同意遵守本服务条款。</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#e3e3e3] mb-3">2. 用户责任</h2>
              <p>用户应确保所购买的账号用于合法目的，不得将账号用于任何违法活动。用户需妥善保管账号信息和查询密码。</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#e3e3e3] mb-3">3. 付款与发货</h2>
              <p>支付成功后，系统将自动发货。请在下单时设置好查询密码，用于后续查询订单和提取账号。</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#e3e3e3] mb-3">4. 售后说明</h2>
              <p>由于账号类商品的特殊性，发货后一般不支持退款。如遇账号问题，请及时联系客服处理。</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[#e3e3e3] mb-3">5. 免责声明</h2>
              <p>平台不对用户使用账号产生的任何后果承担责任。用户应自行承担使用账号的风险。</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

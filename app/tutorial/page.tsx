import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { BookOpen, ShoppingCart, CreditCard, Download, MessageCircle, Shield, CheckCircle } from "lucide-react"

const steps = [
  {
    icon: ShoppingCart,
    title: "1. 选择商品",
    description: "浏览账号类别，选择您需要的账号类型和数量。每个商品都有详细的描述和价格信息。",
  },
  {
    icon: CreditCard,
    title: "2. 支付订单",
    description: "填写您的联系方式（邮箱或手机号），选择微信或支付宝支付方式，完成付款。",
  },
  {
    icon: Download,
    title: "3. 获取账号",
    description: "支付成功后，系统会自动发放账号信息。您可以在支付完成页面或通过订单查询功能查看账号。",
  },
  {
    icon: Shield,
    title: "4. 验证登录",
    description: "如果账号开启了两步验证，使用我们的 2FA 验证工具生成动态验证码完成登录。",
  },
]

const faqs = [
  {
    question: "付款后多久能收到账号？",
    answer: "系统采用自动发货，支付成功后立即发放账号信息，通常在几秒钟内完成。",
  },
  {
    question: "如何查询我的订单？",
    answer: "点击导航栏的\"订单查询\"，输入您的订单号即可查看订单状态和账号信息。订单号会在支付完成后显示。",
  },
  {
    question: "账号无法登录怎么办？",
    answer: "请先确认账号密码是否正确，如果账号有 2FA 验证请使用我们的验证工具。如仍有问题，请联系客服处理。",
  },
  {
    question: "支持哪些支付方式？",
    answer: "目前支持微信支付和支付宝两种支付方式，扫码即可完成付款。",
  },
  {
    question: "可以退款吗？",
    answer: "由于账号类商品的特殊性，一经发货概不退款。请在购买前仔细确认商品信息。",
  },
  {
    question: "账号有效期是多久？",
    answer: "不同类型的账号有效期不同，具体请查看商品详情中的说明。",
  },
]

export default function TutorialPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#131314]">
      <Header />
      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* 标题 */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#81c995]/10 mb-4">
              <BookOpen className="w-8 h-8 text-[#81c995]" />
            </div>
            <h1 className="text-3xl font-bold text-[#e3e3e3] mb-3">使用教程</h1>
            <p className="text-[#9aa0a6] text-lg">简单几步，轻松购买和使用账号</p>
          </div>

          {/* 购买流程 */}
          <div className="mb-16">
            <h2 className="text-xl font-semibold text-[#e3e3e3] mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#7CFF00]" />
              购买流程
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] p-6 hover:border-[#7CFF00]/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#7CFF00]/10 flex items-center justify-center shrink-0">
                      <step.icon className="w-6 h-6 text-[#7CFF00]" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#e3e3e3] mb-2">{step.title}</h3>
                      <p className="text-sm text-[#9aa0a6] leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 常见问题 */}
          <div className="mb-16">
            <h2 className="text-xl font-semibold text-[#e3e3e3] mb-6 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#fdd663]" />
              常见问题
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-[#1e1f20] rounded-xl border border-[#3c3c3f] p-5"
                >
                  <h3 className="text-base font-semibold text-[#e3e3e3] mb-2">{faq.question}</h3>
                  <p className="text-sm text-[#9aa0a6] leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 联系客服 */}
          <div className="bg-gradient-to-r from-[#7CFF00]/10 to-[#81c995]/10 rounded-2xl border border-[#3c3c3f] p-8 text-center">
            <h2 className="text-xl font-semibold text-[#e3e3e3] mb-3">还有其他问题？</h2>
            <p className="text-[#9aa0a6] mb-6">如果您在使用过程中遇到任何问题，欢迎随时联系我们的客服团队</p>
            <a
              href="mailto:support@example.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#7CFF00] hover:bg-[#7CFF00] hover:text-[#131314] text-[#131314] font-semibold rounded-full transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              联系客服
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

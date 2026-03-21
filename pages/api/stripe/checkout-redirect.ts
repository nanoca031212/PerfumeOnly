import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Captura UTMs de POST (body) ou GET (query)
    const bodyUtms = req.body?.utmParams || {};
    const queryUtms: any = {};
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'src', 'sck', 'xcod'];

    utmKeys.forEach(key => {
      if (req.query[key]) {
        queryUtms[key] = req.query[key];
      }
    });

    // Mescla UTMs (query têm prioridade em GET, body em POST)
    const utmParams = { ...queryUtms, ...bodyUtms };
    console.log('📦 UTMs consolidadas:', utmParams);

    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://theperfumeuk.shop';

    // Extrair dados para rastreamento (Facebook CAPI)
    const fbp = req.cookies._fbp || '';
    const fbc = req.cookies._fbc || '';

    // Criar objeto de metadados base
    const rawMetadata: any = {
      utm_campaign: utmParams.utm_campaign,
      utm_source: utmParams.utm_source,
      utm_medium: utmParams.utm_medium,
      utm_content: utmParams.utm_content,
      utm_term: utmParams.utm_term,
      src: utmParams.src,
      sck: utmParams.sck,
      xcod: utmParams.xcod,
      fbp,
      fbc,
    };

    // Limpar metadados (remover campos vazios)
    const metadata = Object.fromEntries(
      Object.entries(rawMetadata).filter(([_, v]) => v != null && v !== '')
    );

    console.log('🎯 Metadados finais para o Stripe:', metadata);

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product: 'prod_UAKeoXZR8FR5Qg',
            unit_amount: 4999,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&${new URLSearchParams(utmParams as any).toString()}`,
      cancel_url: `${origin}/checkout/cancel`,
      shipping_address_collection: {
        allowed_countries: ['GB'],
      },
      phone_number_collection: {
        enabled: true,
      },
      metadata: metadata,
      payment_intent_data: {
        metadata: metadata,
      }
    } as any);

    if (!session.url) {
      throw new Error('Falha ao gerar URL de checkout');
    }

    // Anexar UTMs ao URL do Stripe para persistência visual e tracking
    const stripeUrl = new URL(session.url);
    Object.entries(utmParams).forEach(([key, value]) => {
      if (value) stripeUrl.searchParams.append(key, value as string);
    });

    const finalUrl = stripeUrl.toString();

    if (req.method === 'GET') {
      return res.redirect(303, finalUrl);
    }

    return res.status(200).json({ url: finalUrl });
  } catch (error: any) {
    console.error('Erro ao criar sessão de checkout:', error);
    return res.status(error.statusCode || 500).json({
      error: 'Erro ao criar checkout',
      details: error.message
    });
  }
}

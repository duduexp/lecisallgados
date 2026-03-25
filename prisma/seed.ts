import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const festaProducts = [
  {
    name: 'Coxinha',
    description: 'Deliciosa coxinha com massa crocante e recheio cremoso de frango com catupiry',
    image: '/images/products/coxinha.png',
    featured: true,
  },
  {
    name: 'Risole',
    description: 'Risole dourado e crocante com recheio de carne moída temperada',
    image: '/images/products/risole.png',
    featured: false,
  },
  {
    name: 'Maravilha',
    description: 'Maravilha crocante com recheio de queijo derretido',
    image: '/images/products/maravilha.png',
    featured: false,
  },
  {
    name: 'Kibe',
    description: 'Kibe tradicional com massa de trigo e recheio de carne com temperos árabes',
    image: '/images/products/kibe.png',
    featured: false,
  },
  {
    name: 'Pastel de Carne',
    description: 'Pastel crocante com recheio de carne moída temperada',
    image: '/images/products/pastel.png',
    featured: true,
  },
  {
    name: 'Pastel de Milho',
    description: 'Pastel crocante com recheio cremoso de milho com queijo',
    image: '/images/products/pastel-milho.png',
    featured: false,
  },
  {
    name: 'Espetinho de Frango',
    description: 'Espetinho de frango grelhado com temperos especiais',
    image: '/images/products/espetinho.png',
    featured: false,
  },
  {
    name: 'Enroladinho de Salsicha',
    description: 'Enroladinho de massa macia com salsicha no centro',
    image: '/images/products/enroladinho.png',
    featured: false,
  },
]

const comercioProducts = [
  {
    name: 'Coxinha',
    description: 'Deliciosa coxinha com massa crocante e recheio cremoso de frango com catupiry',
    image: '/images/products/coxinha.png',
    featured: false,
  },
  {
    name: 'Maravilha',
    description: 'Maravilha crocante com recheio de queijo derretido',
    image: '/images/products/maravilha.png',
    featured: false,
  },
  {
    name: 'Pastel de Carne',
    description: 'Pastel crocante com recheio de carne moída temperada',
    image: '/images/products/pastel.png',
    featured: false,
  },
  {
    name: 'Pastel de Milho',
    description: 'Pastel crocante com recheio cremoso de milho com queijo',
    image: '/images/products/pastel-milho.png',
    featured: false,
  },
  {
    name: 'Risole',
    description: 'Risole dourado e crocante com recheio de carne moída temperada',
    image: '/images/products/risole.png',
    featured: false,
  },
  {
    name: 'Kibe',
    description: 'Kibe tradicional com massa de trigo e recheio de carne com temperos árabes',
    image: '/images/products/kibe.png',
    featured: false,
  },
  {
    name: 'Enrolado de Salsicha',
    description: 'Enrolado de massa macia com salsicha no centro',
    image: '/images/products/enroladinho.png',
    featured: false,
  },
  {
    name: 'Enrolado de Presunto e Mussarela',
    description: 'Enrolado de massa macia com recheio de presunto e mussarela derretida',
    image: '/images/products/enrolado-presunto.png',
    featured: false,
  },
]

async function main() {
  console.log('Iniciando seed...')

  // Create categories
  const festaCategory = await prisma.category.upsert({
    where: { slug: 'salgados-para-festa' },
    update: {},
    create: {
      name: 'Salgados para Festa',
      description: 'Salgados perfeitos para sua festa ou evento. Peça com antecedência!',
      slug: 'salgados-para-festa',
      image: '/images/products/coxinha.png',
      active: true,
    },
  })

  const comercioCategory = await prisma.category.upsert({
    where: { slug: 'salgados-para-comercio' },
    update: {},
    create: {
      name: 'Salgados para Comércio',
      description: 'Salgados para revenda. Mínimo de 10 unidades por tipo.',
      slug: 'salgados-para-comercio',
      image: '/images/products/risole.png',
      active: true,
    },
  })

  const bebidasCategory = await prisma.category.upsert({
    where: { slug: 'bebidas' },
    update: {},
    create: {
      name: 'Bebidas',
      description: 'Refrigerantes para acompanhar seus salgados',
      slug: 'bebidas',
      image: '/images/products/refrigerante.png',
      active: true,
    },
  })

  console.log('Categorias criadas!')

  // Create products for festa category
  for (const productData of festaProducts) {
    const product = await prisma.product.upsert({
      where: {
        id: `festa-${productData.name.toLowerCase().replace(/\s+/g, '-')}`,
      },
      update: {
        name: productData.name,
        description: productData.description,
        image: productData.image,
        featured: productData.featured,
        active: true,
      },
      create: {
        id: `festa-${productData.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: productData.name,
        description: productData.description,
        image: productData.image,
        categoryId: festaCategory.id,
        featured: productData.featured,
        active: true,
      },
    })

    // Create variants for festa products (except Espetinho)
    if (productData.name === 'Espetinho de Frango') {
      // Espetinho special variants
      await prisma.productVariant.upsert({
        where: { id: `${product.id}-espetinho-100` },
        update: {},
        create: {
          id: `${product.id}-espetinho-100`,
          productId: product.id,
          name: '100 unidades',
          type: 'espetinho',
          quantity: 100,
          price: 100.0,
          minQuantity: 1,
          active: true,
        },
      })
    } else {
      // Standard festa variants (cru and frito)
      const variants = [
        { qty: 25, type: 'festa_cru', suffix: 'Cru', price: 19.0 },
        { qty: 50, type: 'festa_cru', suffix: 'Cru', price: 37.5 },
        { qty: 100, type: 'festa_cru', suffix: 'Cru', price: 75.0 },
        { qty: 25, type: 'festa_frito', suffix: 'Frito', price: 24.0 },
        { qty: 50, type: 'festa_frito', suffix: 'Frito', price: 47.5 },
        { qty: 100, type: 'festa_frito', suffix: 'Frito', price: 95.0 },
      ]

      for (const variant of variants) {
        await prisma.productVariant.upsert({
          where: { id: `${product.id}-${variant.type}-${variant.qty}` },
          update: {
            price: variant.price,
          },
          create: {
            id: `${product.id}-${variant.type}-${variant.qty}`,
            productId: product.id,
            name: `${variant.qty} unidades - ${variant.suffix}`,
            type: variant.type,
            quantity: variant.qty,
            price: variant.price,
            minQuantity: 1,
            active: true,
          },
        })
      }
    }
  }

  console.log('Produtos de festa criados!')

  // Create products for comercio category
  for (const productData of comercioProducts) {
    const product = await prisma.product.upsert({
      where: {
        id: `comercio-${productData.name.toLowerCase().replace(/\s+/g, '-')}`,
      },
      update: {
        name: productData.name,
        description: productData.description,
        image: productData.image,
        active: true,
      },
      create: {
        id: `comercio-${productData.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: productData.name,
        description: productData.description,
        image: productData.image,
        categoryId: comercioCategory.id,
        active: true,
      },
    })

    // Create variants for comercio products
    await prisma.productVariant.upsert({
      where: { id: `${product.id}-comercio-cru` },
      update: {},
      create: {
        id: `${product.id}-comercio-cru`,
        productId: product.id,
        name: 'Unidade Cru',
        type: 'comercio_cru',
        quantity: 1,
        price: 3.0,
        minQuantity: 10,
        active: true,
      },
    })

    await prisma.productVariant.upsert({
      where: { id: `${product.id}-comercio-frito` },
      update: {},
      create: {
        id: `${product.id}-comercio-frito`,
        productId: product.id,
        name: 'Unidade Frito',
        type: 'comercio_frito',
        quantity: 1,
        price: 5.0,
        minQuantity: 10,
        active: true,
      },
    })
  }

  console.log('Produtos de comércio criados!')

  // Create bebida product
  const refrigeranteProduct = await prisma.product.upsert({
    where: { id: 'refrigerante-2l' },
    update: {},
    create: {
      id: 'refrigerante-2l',
      name: 'Refrigerante',
      description: 'Coca-Cola, Fanta ou Guaraná Antarctica - 2 Litros',
      image: '/images/products/refrigerante.png',
      categoryId: bebidasCategory.id,
      active: true,
    },
  })

  await prisma.productVariant.upsert({
    where: { id: `${refrigeranteProduct.id}-bebida` },
    update: {},
    create: {
      id: `${refrigeranteProduct.id}-bebida`,
      productId: refrigeranteProduct.id,
      name: 'Garrafa 2L',
      type: 'bebida',
      quantity: 1,
      price: 13.0,
      minQuantity: 1,
      active: true,
    },
  })

  console.log('Produto de bebida criado!')

  // Create default admin user
  const hashedPassword = await bcrypt.hash('Fernanda10', 10)
  
  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {
      password: hashedPassword,
    },
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'Administrador',
      email: 'admin@lecisalgados.com',
      active: true,
    },
  })

  console.log('Usuário admin criado!')

  // Create default settings
  const settings = [
    { key: 'delivery_fee', value: '5.00' },
    { key: 'min_order_value', value: '50.00' },
    { key: 'business_name', value: 'Leci Salgados' },
    { key: 'business_phone', value: '(31) 9.9984-0982' },
    { key: 'business_whatsapp', value: '5531999840982' },
    { key: 'business_instagram', value: '@leci.salgados' },
    { key: 'business_address', value: 'Rua Sete de Setembro, N° 88 - Vale do Amanhecer - Igarapé MG' },
    { key: 'pix_key', value: '31999840982' },
    { key: 'advance_order_days', value: '1' },
    { key: 'fried_deposit_percent', value: '50' },
  ]

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: {
        key: setting.key,
        value: setting.value,
      },
    })
  }

  console.log('Configurações criadas!')
  console.log('Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

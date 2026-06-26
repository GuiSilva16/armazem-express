import { motion } from 'framer-motion';

export default function Logo({ size = 'md', showText = false, animated = true }) {
  // O logo.png já inclui o nome "ARMAZÉM EXPRESS", por isso é usado sozinho.
  const sizes = {
    sm: 'h-9 w-9 rounded-lg',
    md: 'h-11 w-11 rounded-xl',
    lg: 'h-16 w-16 rounded-2xl',
    xl: 'h-24 w-24 rounded-3xl'
  };
  const tile = sizes[size] || sizes.md;

  const Wrapper = animated ? motion.div : 'div';
  const wrapperProps = animated
    ? { whileHover: { scale: 1.05 }, transition: { type: 'spring', stiffness: 320 } }
    : {};

  return (
    <Wrapper className="flex items-center" {...wrapperProps}>
      <img
        src="/logo.png"
        alt="Armazém Express"
        className={`${tile} object-cover shadow-sm ring-1 ring-black/5`}
      />
    </Wrapper>
  );
}

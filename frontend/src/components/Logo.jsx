import { motion } from 'framer-motion';

export default function Logo({ size = 'md', showText = true, animated = true }) {
  const sizes = {
    sm: { img: 'h-8 w-8', text: 'text-lg' },
    md: { img: 'h-10 w-10', text: 'text-xl' },
    lg: { img: 'h-14 w-14', text: 'text-2xl' },
    xl: { img: 'h-20 w-20', text: 'text-3xl' }
  };
  const s = sizes[size] || sizes.md;

  const Wrapper = animated ? motion.div : 'div';
  const wrapperProps = animated
    ? { whileHover: { scale: 1.05 }, transition: { type: 'spring', stiffness: 300 } }
    : {};

  return (
    <Wrapper className="flex items-center gap-3" {...wrapperProps}>
      <div className={`${s.img} overflow-hidden flex items-center justify-center`}>
        <img
          src="/logo.png"
          alt="Armazém Express"
          className="w-full h-full object-contain"
        />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-display font-bold ${s.text} text-brand-red-500`}>
            Armazém
          </span>
          <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 tracking-widest uppercase">
            Express
          </span>
        </div>
      )}
    </Wrapper>
  );
}

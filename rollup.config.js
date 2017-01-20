import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
export default {
  format: 'cjs',
  plugins: [
    resolve({
      jsnext: true,
      extensions: ['', '.es', '.js', '.json']
    }),
    babel()
  ]
};

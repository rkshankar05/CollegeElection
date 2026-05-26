export default function Card({ as: Component = "div", className = "", ...props }) {
  const classes = className ? `card ${className}` : "card";
  return <Component className={classes} {...props} />;
}

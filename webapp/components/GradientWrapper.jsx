const GradientWrapper = ({ children, ...props }) => (
    <div
        {...props}
        className={`relative ${props.className || ""}`}>
        <div className={`absolute m-auto blur-[160px] ${props.wrapperClassName || ""}`}
            style={{
                background:
                    "linear-gradient(180deg,rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0.98) 0.01%, rgba(0, 0, 0, 0.2) 100%)",
            }}>

        </div>
        <div className="relative">
            {children}
        </div>
    </div>
)

export default GradientWrapper
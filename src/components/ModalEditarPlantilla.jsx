import PropTypes from 'prop-types';
import { useState } from 'react';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import logApiRequest from "../requestLogger"; // Import the logger utility

const ModalEditarPlantilla = ({ template, onClose, onTemplateUpdated }) => {
    const [nombre, setNombre] = useState(template.name || "");
    const [plataforma, setPlataforma] = useState(template.platform || "");
    const [tipo, setTipo] = useState(template.type || "Plantillas de mensajes");
    const [cuerpo, setCuerpo] = useState(template.body || "");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const tipos = [
        "Plantillas de mensajes",
        "Plantillas de comentarios"
    ];

    const plataformas = [
        "Instagram",
        "WhatsApp",
        "Facebook",
        "TikTok",
        "Email"
    ];

    const handleSave = async () => {
        // Validar todos los campos
        if (!nombre.trim()) {
            setError("El nombre de la plantilla es obligatorio");
            return;
        }
        
        if (!plataforma.trim()) {
            setError("La plataforma es obligatoria");
            return;
        }
        
        if (!cuerpo.trim()) {
            setError("El cuerpo del mensaje es obligatorio");
            return;
        }
    
        // Validar template
        if (!template || !template.id || !template.userId) {
            setError("Error: Datos de plantilla incompletos");
            console.error("Error: Falta el ID de la plantilla o el usuario.", template);
            return;
        }
    
        try {
            setIsLoading(true);
            setError("");
            
            // Log the template update attempt
            await logApiRequest({
                endpoint: "internal/update_template",
                requestData: {
                    templateId: template.id,
                    name: nombre.trim(),
                    platform: plataforma.trim(),
                    type: tipo,
                    bodyLength: cuerpo.trim().length
                },
                userId: template.userId,
                status: "pending",
                source: "ModalEditarPlantilla",
                metadata: {
                    action: "update_template",
                    templateId: template.id,
                    originalName: template.name,
                    newName: nombre.trim(),
                    originalPlatform: template.platform,
                    newPlatform: plataforma.trim(),
                    originalType: template.type,
                    newType: tipo,
                    originalBodyLength: template.body?.length || 0,
                    newBodyLength: cuerpo.trim().length
                }
            });
            
            const templateRef = doc(db, "users", template.userId, "templates", template.id);
            await updateDoc(templateRef, {
                name: nombre.trim(),
                platform: plataforma.trim(),
                type: tipo,
                body: cuerpo.trim(),
                updatedAt: new Date() // Añadir fecha de actualización
            });
    
            setSuccess("Plantilla actualizada con éxito");
            
            // Log the template update success
            await logApiRequest({
                endpoint: "internal/update_template",
                requestData: {
                    templateId: template.id,
                    name: nombre.trim()
                },
                userId: template.userId,
                status: "success",
                source: "ModalEditarPlantilla",
                metadata: {
                    action: "update_template",
                    templateId: template.id,
                    templateName: nombre.trim()
                }
            });
            
            // Notificar al componente padre que se ha actualizado la plantilla
            if (onTemplateUpdated) {
                onTemplateUpdated();
            }
            
            // Cerrar el modal después de un breve retraso
            setTimeout(() => {
                onClose();
            }, 1500);
            
        } catch (error) {
            console.error("Error al actualizar la plantilla:", error);
            setError(`Error al actualizar: ${error.message || "Algo salió mal"}`);
            setIsLoading(false);
            
            // Log the template update error
            await logApiRequest({
                endpoint: "internal/update_template",
                requestData: {
                    templateId: template.id,
                    name: nombre.trim()
                },
                userId: template.userId,
                status: "error",
                source: "ModalEditarPlantilla",
                metadata: {
                    action: "update_template",
                    templateId: template.id,
                    error: error.message || "Unknown error"
                }
            });
        }
    };

    // Vista previa del mensaje
    const handlePreview = () => {
        // Aquí podrías implementar una vista previa más detallada si es necesario
        alert(cuerpo);
        
        // Log the preview action
        logApiRequest({
            endpoint: "internal/preview_template",
            requestData: {
                templateId: template.id
            },
            userId: template.userId,
            status: "success",
            source: "ModalEditarPlantilla",
            metadata: {
                action: "preview_template",
                templateId: template.id,
                templateName: nombre.trim()
            }
        });
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 w-full max-w-[500px] relative">
                
                {/* Notificaciones de error y éxito */}
                {error && (
                    <div className="mb-4 p-2 md:p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}
                
                {success && (
                    <div className="mb-4 p-2 md:p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm">
                        {success}
                    </div>
                )}
                
                {/* Botón de cerrar - sin fondo */}
                <button
                    className="absolute top-3 right-3 md:top-4 md:right-4 text-gray-600 hover:text-gray-800 transition"
                    style={{ backgroundColor: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                    onClick={() => {
                        // Log the close action
                        logApiRequest({
                            endpoint: "internal/close_edit_template",
                            requestData: {
                                templateId: template.id
                            },
                            userId: template.userId,
                            status: "success",
                            source: "ModalEditarPlantilla",
                            metadata: {
                                action: "close_edit_template",
                                templateId: template.id,
                                templateName: template.name,
                                wasSaved: success !== ""
                            }
                        });
                        
                        onClose();
                    }}
                    disabled={isLoading}
                >
                    ✕
                </button>

                {/* Título */}
                <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">Editar plantilla de mensaje</h2>

                {/* Nombre de la plantilla */}
                <label className="text-gray-600 text-xs md:text-sm font-medium">Nombre de la plantilla</label>
                <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full p-2 md:p-3 mt-1 mb-3 md:mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C6CEFF] bg-white text-gray-700 text-sm md:text-base"
                    placeholder="Nombre de la plantilla"
                    disabled={isLoading}
                />

                {/* Plataforma */}
                <label className="text-gray-600 text-xs md:text-sm font-medium">Plataforma</label>
                <select
                    className="w-full p-2 md:p-3 mt-1 mb-3 md:mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C6CEFF] bg-white text-gray-700 text-sm md:text-base"
                    value={plataforma}
                    onChange={(e) => setPlataforma(e.target.value)}
                    disabled={isLoading}
                >
                    <option value="">Seleccionar plataforma...</option>
                    {plataformas.map(plat => (
                        <option key={plat} value={plat}>{plat}</option>
                    ))}
                </select>

                {/* Tipo de plantilla */}
                <label className="text-gray-600 text-xs md:text-sm font-medium">Tipo de plantilla</label>
                <select
                    className="w-full p-2 md:p-3 mt-1 mb-3 md:mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C6CEFF] bg-white text-gray-700 text-sm md:text-base"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    disabled={isLoading}
                >
                    {tipos.map(t => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>

                {/* Cuerpo */}
                <label className="text-gray-600 text-xs md:text-sm font-medium">Cuerpo</label>
                <div className="border border-gray-300 rounded-lg mt-1">
                    <div className="flex items-center justify-between bg-[#F3F2FC] p-2 rounded-t-lg">
                        <button 
                            className="text-gray-600 text-xs font-medium bg-transparent border-none hover:text-gray-800"
                            disabled={isLoading}
                            onClick={handlePreview}
                        >
                            👀 Vista previa
                        </button>
                        <button 
                            className="text-gray-600 text-xs font-medium bg-transparent border-none hover:text-gray-800"
                            disabled={isLoading}
                        >
                            ➕ Insertar variable
                        </button>
                    </div>
                    <textarea
                        value={cuerpo}
                        onChange={(e) => setCuerpo(e.target.value)}
                        className="w-full p-2 md:p-3 border-t border-gray-300 focus:outline-none resize-none h-24 md:h-32 bg-white text-gray-700 text-sm md:text-base"
                        disabled={isLoading}
                        placeholder="Escribe el contenido de tu plantilla aquí..."
                    />
                </div>

                {/* Botones de formato */}
                <div className="flex flex-wrap gap-2 md:gap-4 text-gray-600 mt-3 md:mt-4">
                <button 
                    className="p-1 md:p-2 px-2 md:px-3 flex items-center justify-center bg-[#A0B1FF] hover:bg-blue-700 rounded-full text-white font-medium text-xs md:text-sm"
                    style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
                    disabled={isLoading}
                    onClick={() => {
                        setCuerpo(cuerpo + " [nombre]");
                        
                        // Log the variable insertion
                        logApiRequest({
                            endpoint: "internal/insert_template_variable",
                            requestData: {
                                templateId: template.id,
                                variable: "nombre"
                            },
                            userId: template.userId,
                            status: "success",
                            source: "ModalEditarPlantilla",
                            metadata: {
                                action: "insert_template_variable",
                                templateId: template.id,
                                variable: "nombre"
                            }
                        });
                    }}
                    title="Insertar variable de nombre"
                >
                    📝 Nombre
                </button>
                <button 
                    className="p-1 md:p-2 px-2 md:px-3 flex items-center justify-center bg-[#A0B1FF] hover:bg-blue-700 rounded-full text-white font-medium text-xs md:text-sm"
                    style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
                    disabled={isLoading}
                    onClick={() => {
                        setCuerpo(cuerpo + " [producto]");
                        
                        // Log the variable insertion
                        logApiRequest({
                            endpoint: "internal/insert_template_variable",
                            requestData: {
                                templateId: template.id,
                                variable: "producto"
                            },
                            userId: template.userId,
                            status: "success",
                            source: "ModalEditarPlantilla",
                            metadata: {
                                action: "insert_template_variable",
                                templateId: template.id,
                                variable: "producto"
                            }
                        });
                    }}
                    title="Insertar variable de producto"
                >
                    📦 Producto
                </button>
                <button 
                    className="p-1 md:p-2 px-2 md:px-3 flex items-center justify-center bg-[#A0B1FF] hover:bg-blue-700 rounded-full text-white font-medium text-xs md:text-sm"
                    style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
                    disabled={isLoading}
                    onClick={() => {
                        setCuerpo(cuerpo + " [emoji]");
                        
                        // Log the variable insertion
                        logApiRequest({
                            endpoint: "internal/insert_template_variable",
                            requestData: {
                                templateId: template.id,
                                variable: "emoji"
                            },
                            userId: template.userId,
                            status: "success",
                            source: "ModalEditarPlantilla",
                            metadata: {
                                action: "insert_template_variable",
                                templateId: template.id,
                                variable: "emoji"
                            }
                        });
                    }}
                    title="Insertar emoji"
                >
                    😊 Emoji
                </button>
            </div>
                {/* Botón Guardar (color ajustado) */}
                <button
                    className="mt-4 md:mt-6 w-full bg-[#A0B1FF] text-white py-2 md:py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-[#B0BAF5] transition text-sm md:text-base"
                    onClick={handleSave}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 md:h-5 md:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Guardando...
                        </>
                    ) : "Guardar →"}
                </button>
            </div>
        </div>
    );
};

ModalEditarPlantilla.propTypes = {
    template: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
    onTemplateUpdated: PropTypes.func
};

export default ModalEditarPlantilla;
import React from 'react';
import { DocumentViewer } from '../../common';

const LandDetails = ({ land, additionalDocuments }) => {
    return (
        <div>
            <h2>Land Details</h2>
            <p>Owner: {land.owner}</p>
            <p>Location: {land.location}</p>
            <p>Size: {land.size}</p>
            <div className="land-documents">
                <h3>Land Documents</h3>
                <DocumentViewer
                    documentHash={land.documentHash}
                    description="Primary Document"
                    type="iframe"
                />
                {additionalDocuments.map((doc, index) => (
                    <DocumentViewer
                        key={index}
                        documentHash={doc.hash}
                        description={doc.description}
                        type="iframe"
                    />
                ))}
            </div>
        </div>
    );
};

export default LandDetails;
